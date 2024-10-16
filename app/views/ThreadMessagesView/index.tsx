import React, { useCallback, useEffect, useLayoutEffect, useReducer } from 'react';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Observable, Subscription } from 'rxjs';

import { showActionSheetRef } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import StatusBar from '../../containers/StatusBar';
import buildMessage from '../../lib/methods/helpers/buildMessage';
import log from '../../lib/methods/helpers/log';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import { themes } from '../../lib/constants';
import { useTheme, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import BackgroundContainer from '../../containers/BackgroundContainer';
import { getBadgeColor, makeThreadName } from '../../lib/methods/helpers/room';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../../containers/Toast';
import SearchHeader from '../../containers/SearchHeader';
import { Filter } from './filters';
import Item from './Item';
import styles from './styles';
import { IApplicationState, IMessage, SubscriptionType, TSubscriptionModel, TThreadModel } from '../../definitions';
import { getUidDirectMessage, debounce, isIOS } from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import UserPreferences from '../../lib/methods/userPreferences';
import { ISearchThreadMessages, IThreadMessagesViewProps } from './types';
import { threadMessagesInitialState, threadReducer } from './reducer';
import { useAppSelector } from '../../lib/hooks';

const API_FETCH_COUNT = 50;
const THREADS_FILTER = 'threadsFilter';

const ThreadMessagesView = ({ navigation, route }: IThreadMessagesViewProps) => {
	const rid = route.params?.rid;
	let subSubscription: Subscription;
	let messagesSubscription: Subscription;
	let messagesObservable: Observable<TThreadModel[]>;

	const { theme } = useTheme();

	const { user, useRealName, isMasterDetail } = useAppSelector(state => ({
		user: getUserSelector(state),
		useRealName: state.settings.UI_Use_Real_Name as boolean,
		isMasterDetail: state.app.isMasterDetail
	}));

	const [state, dispatch] = useReducer(threadReducer, threadMessagesInitialState);
	const { currentFilter, displayingThreads, end, loading, messages, offset, search, subscription } = state;

	const setLoading = (value: boolean) => dispatch({ type: 'SET_LOADING', payload: value });
	const setEnd = (value: boolean) => dispatch({ type: 'SET_END', payload: value });
	const setMessages = (value: TThreadModel[]) => dispatch({ type: 'SET_MESSAGES', payload: value });
	const setDisplayingThreads = (value: TThreadModel[]) => dispatch({ type: 'SET_DISPLAYING_THREADS', payload: value });
	const setSubscription = (value: TSubscriptionModel) => dispatch({ type: 'SET_SUBSCRIPTION', payload: value });
	const setCurrentFilter = (value: Filter) => dispatch({ type: 'SET_FILTER', payload: value });
	const setSearch = (value: ISearchThreadMessages) => dispatch({ type: 'SET_SEARCH', payload: value });
	const setOffset = (value: number) => dispatch({ type: 'SET_OFFSET', payload: value });

	const initSubscription = async () => {
		try {
			const db = database.active;

			// subscription query
			const subscription = await db.get('subscriptions').find(rid);
			const observable = subscription.observe();
			subSubscription = observable.subscribe(data => {
				setSubscription(data);
			});

			subscribeMessages(subscription);
		} catch (e) {
			log(e);
		}
	};

	const subscribeMessages = (subscription?: TSubscriptionModel, searchText?: string) => {
		try {
			const db = database.active;

			if (messagesSubscription && messagesSubscription.unsubscribe) {
				messagesSubscription.unsubscribe();
			}

			const whereClause = [Q.where('rid', rid), Q.sortBy('tlm', Q.desc)];

			if (searchText?.trim()) {
				whereClause.push(Q.where('msg', Q.like(`%${sanitizeLikeString(searchText.trim())}%`)));
			}

			messagesObservable = db
				.get('threads')
				.query(...whereClause)
				.observeWithColumns(['_updated_at']);

			messagesSubscription = messagesObservable.subscribe(messages => {
				const displayingThreads = getFilteredThreads(messages, subscription, currentFilter);
				setMessages(messages);
				setDisplayingThreads(displayingThreads);
			});
		} catch (e) {
			log(e);
		}
	};

	const initFilter = () => {
		const savedFilter = UserPreferences.getString(THREADS_FILTER);
		if (savedFilter) {
			setCurrentFilter(savedFilter as Filter);
		}
	};

	const init = async () => {
		initFilter();
		if (!subscription) {
			return load();
		}
		try {
			const lastThreadSync = new Date();
			if (subscription.lastThreadSync) {
				sync(subscription.lastThreadSync);
			} else {
				load(lastThreadSync);
			}
		} catch (e) {
			log(e);
		}
	};

	const updateThreads = async ({
		update,
		remove,
		lastThreadSync
	}: {
		update: IMessage[];
		remove?: IMessage[];
		lastThreadSync: Date;
	}) => {
		// if there's no subscription, manage data on this.state.messages
		// note: sync will never be called without subscription

		try {
			const db = database.active;
			const threadsCollection = db.get('threads');
			const allThreadsRecords = await subscription.threads.fetch();
			let threadsToCreate: TThreadModel[] = [];
			let threadsToUpdate: (TThreadModel | null | undefined)[] = [];
			let threadsToDelete: TThreadModel[] = [];

			if (remove && remove.length) {
				threadsToDelete = allThreadsRecords.filter((i1: { id: string }) => remove.find(i2 => i1.id === i2._id));
				threadsToDelete = threadsToDelete.map(t => t.prepareDestroyPermanently());
			}

			if (update && update.length) {
				update = update.map(m => buildMessage(m)) as IMessage[];
				// filter threads
				threadsToCreate = update.filter(
					i1 => !allThreadsRecords.find((i2: { id: string }) => i1._id === i2.id)
				) as TThreadModel[];
				threadsToUpdate = allThreadsRecords.filter((i1: { id: string }) => update.find(i2 => i1.id === i2._id));
				threadsToCreate = threadsToCreate.map(thread =>
					threadsCollection.prepareCreate(
						protectedFunction((t: any) => {
							t._raw = sanitizedRaw({ id: thread._id }, threadsCollection.schema);
							t.subscription.set(subscription);
							Object.assign(t, thread);
						})
					)
				);
				threadsToUpdate = threadsToUpdate.map(thread => {
					const newThread = update.find(t => t._id === thread?.id);
					try {
						return thread?.prepareUpdate(
							protectedFunction((t: TThreadModel) => {
								Object.assign(t, newThread);
							})
						);
					} catch {
						return null;
					}
				});
			}

			await db.write(async () => {
				await db.batch(
					...threadsToCreate,
					...threadsToUpdate,
					...threadsToDelete,
					subscription.prepareUpdate(s => {
						s.lastThreadSync = lastThreadSync;
					})
				);
			});
		} catch (e) {
			log(e);
		}
	};

	const load = debounce(async (lastThreadSync: Date) => {
		if (end || loading) {
			return;
		}

		setLoading(true);

		try {
			const result = await Services.getThreadsList({
				rid,
				count: API_FETCH_COUNT,
				offset,
				text: search.searchText
			});
			if (result.success) {
				updateThreads({ update: result.threads, lastThreadSync });
				setLoading(false);
				setEnd(result.count < API_FETCH_COUNT);
				setOffset(offset + API_FETCH_COUNT);
			}
		} catch (e) {
			log(e);
			setLoading(false);
			setEnd(true);
		}
	}, 300);

	const sync = async (updatedSince: Date) => {
		setLoading(true);

		try {
			const result = await Services.getSyncThreadsList({
				rid,
				updatedSince: updatedSince.toISOString()
			});
			if (result.success && result.threads) {
				const { update, remove } = result.threads;
				updateThreads({ update, remove, lastThreadSync: updatedSince });
			}
			setLoading(false);
		} catch (e) {
			log(e);
			setLoading(false);
		}
	};

	const onSearchPress = () => {
		setSearch({ ...search, isSearching: true });
		const options = getHeader(true);
		navigation.setOptions(options);
	};

	const onCancelSearchPress = () => {
		setSearch({
			isSearching: false,
			searchText: ''
		});
		setHeader();
		subscribeMessages(subscription);
	};

	const onSearchChangeText = debounce((searchText: string) => {
		setSearch({ isSearching: true, searchText });
		subscribeMessages(subscription, searchText);
	}, 300);

	const onThreadPress = debounce(
		(item: any) => {
			if (isMasterDetail) {
				navigation.pop();
			}
			navigation.push('RoomView', {
				rid: item.subscription.id,
				tmid: item.id,
				name: makeThreadName(item),
				t: SubscriptionType.THREAD,
				roomUserId: getUidDirectMessage(subscription)
			});
		},
		1000,
		true
	);

	const handleBadgeColor = (item: TThreadModel) => getBadgeColor({ subscription, theme, messageId: item?.id });

	const getHeader = (triggerSearch?: boolean): NativeStackNavigationOptions => {
		if (search.isSearching || triggerSearch) {
			return {
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={onCancelSearchPress} />
					</HeaderButton.Container>
				),
				headerTitle: () => <SearchHeader onSearchChangeText={onSearchChangeText} testID='thread-messages-view-search-header' />,
				headerRight: () => null
			};
		}

		const options: NativeStackNavigationOptions = {
			headerLeft: () => null,
			headerTitle: I18n.t('Threads'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='filter' onPress={showFilters} />
					<HeaderButton.Item iconName='search' onPress={onSearchPress} testID='thread-messages-view-search-icon' />
				</HeaderButton.Container>
			)
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		return options;
	};

	const setHeader = () => {
		const options = getHeader();
		navigation.setOptions(options);
	};

	const toggleFollowThread = async (isFollowingThread: boolean, tmid: string) => {
		try {
			await Services.toggleFollowMessage(tmid, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
			const updatedThreads = getFilteredThreads(messages, subscription, currentFilter);
			setDisplayingThreads(updatedThreads);
		} catch (e) {
			log(e);
		}
	};

	// helper to query threads
	const getFilteredThreads = (
		messages: TThreadModel[],
		subscription?: TSubscriptionModel,
		currentFilter?: Filter
	): TThreadModel[] => {
		if (currentFilter === Filter.Following) {
			return messages.filter(item => item?.replies?.find(u => u === user.id));
		}
		if (currentFilter === Filter.Unread) {
			return messages?.filter(item => subscription?.tunread?.includes(item?.id));
		}
		return messages;
	};

	const showFilters = () => {
		showActionSheetRef({
			options: [
				{
					title: I18n.t(Filter.All),
					right: currentFilter === Filter.All ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => onFilterSelected(Filter.All)
				},
				{
					title: I18n.t(Filter.Following),
					right: currentFilter === Filter.Following ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => onFilterSelected(Filter.Following)
				},
				{
					title: I18n.t(Filter.Unread),
					right: currentFilter === Filter.Unread ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => onFilterSelected(Filter.Unread)
				}
			]
		});
	};

	const onFilterSelected = useCallback(
		(filter: Filter) => {
			const displayingThreads = getFilteredThreads(messages, subscription, filter);
			setCurrentFilter(filter);
			setDisplayingThreads(displayingThreads);
			UserPreferences.setString(THREADS_FILTER, filter);
		},
		[messages, subscription]
	);

	const renderItem = ({ item }: { item: TThreadModel }) => {
		const badgeColor = handleBadgeColor(item);
		return (
			<Item
				{...{
					item,
					user,
					navigation,
					useRealName,
					badgeColor
				}}
				onPress={onThreadPress}
				toggleFollowThread={toggleFollowThread}
			/>
		);
	};

	const Content = (): React.JSX.Element => {
		if (!messages?.length || !displayingThreads?.length) {
			let text;
			if (currentFilter === Filter.Following) {
				text = I18n.t('No_threads_following');
			} else if (currentFilter === Filter.Unread) {
				text = I18n.t('No_threads_unread');
			} else {
				text = I18n.t('No_threads');
			}
			return <BackgroundContainer text={text} />;
		}

		return (
			<FlatList
				keyExtractor={item => item.id}
				extraData={displayingThreads}
				data={displayingThreads}
				renderItem={renderItem}
				style={[styles.list, { backgroundColor: themes[theme].surfaceRoom }]}
				contentContainerStyle={styles.contentContainer}
				onEndReached={load}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				initialNumToRender={7}
				removeClippedSubviews={isIOS}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
				scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
			/>
		);
	};

	useLayoutEffect(() => {
		initSubscription();
		subscribeMessages();
		init();
		return () => {
			console.countReset(`${ThreadMessagesView.name}.render calls`);
			if (subSubscription) {
				subSubscription.unsubscribe();
			}
			if (messagesSubscription) {
				messagesSubscription.unsubscribe();
			}
		};
	}, [currentFilter]);

	useEffect(() => {
		setHeader();
	}, [messages, currentFilter]);

	console.count(`${ThreadMessagesView.name}.render calls`);

	return (
		<SafeAreaView testID='thread-messages-view'>
			<StatusBar />
			<Content />
		</SafeAreaView>
	);
};

export default ThreadMessagesView;

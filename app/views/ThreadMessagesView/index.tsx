import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { StackNavigationOptions } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
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
import { withTheme } from '../../theme';
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
import { IThreadMessagesViewProps } from './types';

const API_FETCH_COUNT = 50;
const THREADS_FILTER = 'threadsFilter';

const ThreadMessagesView = ({ navigation, route, theme, isMasterDetail, useRealName, user }: IThreadMessagesViewProps) => {
	const rid = route.params?.rid;
	let subSubscription: Subscription;
	let messagesSubscription: Subscription;
	let messagesObservable: Observable<TThreadModel[]>;

	//Improve states and check re-renders

	const [loading, setLoading] = useState(false);
	const [end, setEnd] = useState(false);
	const [messages, setMessages] = useState<any[]>([]);
	const [displayingThreads, setDisplayingThreads] = useState<TThreadModel[]>([]);
	const [subscription, setSubscription] = useState({} as TSubscriptionModel);
	const [currentFilter, setCurrentFilter] = useState(Filter.All);
	const [isSearching, setIsSearching] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [offset, setOffset] = useState(0);

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
				setHeader();
			});
		} catch (e) {
			log(e);
		}
	};

	const initFilter = () =>
		new Promise<void>(resolve => {
			const savedFilter = UserPreferences.getString(THREADS_FILTER);
			if (savedFilter) {
				setCurrentFilter(savedFilter as Filter);
				resolve();
			}
			resolve();
		});

	const init = async () => {
		await initFilter();
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
		if (!subscription._id) {
			setHeader();
			setMessages([...messages, ...update] as TThreadModel[]);
			return;
		}

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

	// eslint-disable-next-line react/sort-comp
	const load = debounce(async (lastThreadSync: Date) => {
		if (end || loading) {
			return;
		}

		setLoading(true);

		try {
			const result = await Services.getThreadsList({
				rid: rid,
				count: API_FETCH_COUNT,
				offset,
				text: searchText
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

	// eslint-disable-next-line react/sort-comp
	const sync = async (updatedSince: Date) => {
		setLoading(true);

		try {
			const result = await Services.getSyncThreadsList({
				rid: rid,
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
		setIsSearching(true);
		setHeader();
	};

	const onCancelSearchPress = () => {
		setIsSearching(false);
		setSearchText('');
		setHeader();
		subscribeMessages(subscription);
	};

	const onSearchChangeText = debounce((searchText: string) => {
		setSearchText(searchText);
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

	const handleBadgeColor = (item: TThreadModel) => {
		return getBadgeColor({ subscription, theme, messageId: item?.id });
	};

	const getHeader = (): StackNavigationOptions => {
		if (isSearching) {
			return {
				headerTitleAlign: 'left',
				headerTitleContainerStyle: { flex: 1, marginHorizontal: 0, marginRight: 15, maxWidth: undefined },
				headerRightContainerStyle: { flexGrow: 0 },
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={onCancelSearchPress} />
					</HeaderButton.Container>
				),
				headerTitle: () => <SearchHeader onSearchChangeText={onSearchChangeText} testID='thread-messages-view-search-header' />,
				headerRight: () => null
			};
		}

		const options: StackNavigationOptions = {
			headerTitleAlign: 'center',
			headerTitle: I18n.t('Threads'),
			headerTitleContainerStyle: {},
			headerRightContainerStyle: { flexGrow: 1 },
			headerLeft: () => (
				<HeaderBackButton
					labelVisible={false}
					onPress={() => navigation.pop()}
					tintColor={themes[theme].fontSecondaryInfo}
					testID='header-back'
				/>
			),
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

	const onFilterSelected = (filter: Filter) => {
		const displayingThreads = getFilteredThreads(messages, subscription, filter);
		setCurrentFilter(filter);
		setDisplayingThreads(displayingThreads);
		UserPreferences.setString(THREADS_FILTER, filter);
	};

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

	const renderContent = () => {
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
				extraData={messages}
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
	}, []);

	useEffect(() => {
		setHeader();
	}, [messages, currentFilter]);

	useEffect(() => {
		const options = getHeader();
		navigation.setOptions(options);
	}, [isSearching]);

	console.count(`${ThreadMessagesView.name}.render calls`);

	return (
		<SafeAreaView testID='thread-messages-view'>
			<StatusBar />
			{renderContent()}
		</SafeAreaView>
	);
};

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	useRealName: state.settings.UI_Use_Real_Name as boolean,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(ThreadMessagesView));

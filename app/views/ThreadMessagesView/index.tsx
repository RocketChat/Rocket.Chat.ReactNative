import React from 'react';
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
import { TSupportedThemes, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import BackgroundContainer from '../../containers/BackgroundContainer';
import { getBadgeColor, makeThreadName } from '../../lib/methods/helpers/room';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../../containers/Toast';
import SearchHeader from '../../containers/SearchHeader';
import { ChatsStackParamList } from '../../stacks/types';
import { Filter } from './filters';
import Item from './Item';
import styles from './styles';
import { IApplicationState, IBaseScreen, IMessage, SubscriptionType, TSubscriptionModel, TThreadModel } from '../../definitions';
import { getUidDirectMessage, debounce, isIOS } from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import UserPreferences from '../../lib/methods/userPreferences';

const API_FETCH_COUNT = 50;
const THREADS_FILTER = 'threadsFilter';

interface IThreadMessagesViewState {
	loading: boolean;
	end: boolean;
	messages: any[];
	displayingThreads: TThreadModel[];
	subscription: TSubscriptionModel;
	currentFilter: Filter;
	isSearching: boolean;
	searchText: string;
	offset: number;
}

interface IThreadMessagesViewProps extends IBaseScreen<ChatsStackParamList, 'ThreadMessagesView'> {
	user: { id: string };
	baseUrl: string;
	useRealName: boolean;
	theme: TSupportedThemes;
	isMasterDetail: boolean;
}

class ThreadMessagesView extends React.Component<IThreadMessagesViewProps, IThreadMessagesViewState> {
	private mounted: boolean;

	private rid: string;

	private subSubscription?: Subscription;

	private messagesSubscription?: Subscription;

	private messagesObservable?: Observable<TThreadModel[]>;

	constructor(props: IThreadMessagesViewProps) {
		super(props);
		this.mounted = false;
		this.rid = props.route.params?.rid;
		this.state = {
			loading: false,
			end: false,
			messages: [],
			displayingThreads: [],
			subscription: {} as TSubscriptionModel,
			currentFilter: Filter.All,
			isSearching: false,
			searchText: '',
			offset: 0
		};
		this.setHeader();
		this.initSubscription();
		this.subscribeMessages();
	}

	componentDidMount() {
		this.mounted = true;
		this.init();
	}

	componentWillUnmount() {
		console.countReset(`${this.constructor.name}.render calls`);
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}
		if (this.messagesSubscription && this.messagesSubscription.unsubscribe) {
			this.messagesSubscription.unsubscribe();
		}
	}

	getHeader = (): NativeStackNavigationOptions => {
		const { isSearching } = this.state;
		const { navigation, isMasterDetail } = this.props;

		if (isSearching) {
			return {
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={this.onCancelSearchPress} />
					</HeaderButton.Container>
				),
				headerTitle: () => (
					<SearchHeader onSearchChangeText={this.onSearchChangeText} testID='thread-messages-view-search-header' />
				),
				headerRight: () => null
			};
		}

		const options: NativeStackNavigationOptions = {
			headerLeft: () => null,
			headerTitle: I18n.t('Threads'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='filter' onPress={this.showFilters} />
					<HeaderButton.Item iconName='search' onPress={this.onSearchPress} testID='thread-messages-view-search-icon' />
				</HeaderButton.Container>
			)
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		return options;
	};

	setHeader = () => {
		const { navigation } = this.props;
		const options = this.getHeader();
		navigation.setOptions(options);
	};

	initSubscription = async () => {
		try {
			const db = database.active;

			// subscription query
			const subscription = await db.get('subscriptions').find(this.rid);
			const observable = subscription.observe();
			this.subSubscription = observable.subscribe(data => {
				this.setState({ subscription: data });
			});

			this.subscribeMessages(subscription);
		} catch (e) {
			log(e);
		}
	};

	subscribeMessages = (subscription?: TSubscriptionModel, searchText?: string) => {
		try {
			const db = database.active;

			if (this.messagesSubscription && this.messagesSubscription.unsubscribe) {
				this.messagesSubscription.unsubscribe();
			}

			const whereClause = [Q.where('rid', this.rid), Q.sortBy('tlm', Q.desc)];

			if (searchText?.trim()) {
				whereClause.push(Q.where('msg', Q.like(`%${sanitizeLikeString(searchText.trim())}%`)));
			}

			this.messagesObservable = db
				.get('threads')
				.query(...whereClause)
				.observeWithColumns(['updated_at']);

			this.messagesSubscription = this.messagesObservable.subscribe(messages => {
				const { currentFilter } = this.state;
				const displayingThreads = this.getFilteredThreads(messages, subscription, currentFilter);
				if (this.mounted) {
					this.setState({ messages, displayingThreads });
				} else {
					// @ts-ignore
					this.state.messages = messages;
					// @ts-ignore
					this.state.displayingThreads = displayingThreads;
				}
			});
		} catch (e) {
			log(e);
		}
	};

	initFilter = () =>
		new Promise<void>(resolve => {
			const savedFilter = UserPreferences.getString(THREADS_FILTER);
			if (savedFilter) {
				this.setState({ currentFilter: savedFilter as Filter }, () => resolve());
			}
			resolve();
		});

	init = async () => {
		const { subscription } = this.state;
		await this.initFilter();
		if (!subscription) {
			return this.load();
		}
		try {
			const lastThreadSync = new Date();
			if (subscription.lastThreadSync) {
				this.sync(subscription.lastThreadSync);
			} else {
				this.load(lastThreadSync);
			}
		} catch (e) {
			log(e);
		}
	};

	updateThreads = async ({
		update,
		remove,
		lastThreadSync
	}: {
		update: IMessage[];
		remove?: IMessage[];
		lastThreadSync: Date;
	}) => {
		const { subscription } = this.state;
		// if there's no subscription, manage data on this.state.messages
		// note: sync will never be called without subscription
		if (!subscription._id) {
			this.setState(({ messages }) => ({ messages: [...messages, ...update] }));
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
	load = debounce(async (lastThreadSync: Date) => {
		const { loading, end, searchText, offset } = this.state;
		if (end || loading || !this.mounted) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await Services.getThreadsList({
				rid: this.rid,
				count: API_FETCH_COUNT,
				offset,
				text: searchText
			});
			if (result.success) {
				this.updateThreads({ update: result.threads, lastThreadSync });
				this.setState({
					loading: false,
					end: result.count < API_FETCH_COUNT,
					offset: offset + API_FETCH_COUNT
				});
			}
		} catch (e) {
			log(e);
			this.setState({ loading: false, end: true });
		}
	}, 300);

	// eslint-disable-next-line react/sort-comp
	sync = async (updatedSince: Date) => {
		this.setState({ loading: true });

		try {
			const result = await Services.getSyncThreadsList({
				rid: this.rid,
				updatedSince: updatedSince.toISOString()
			});
			if (result.success && result.threads) {
				const { update, remove } = result.threads;
				this.updateThreads({ update, remove, lastThreadSync: updatedSince });
			}
			this.setState({
				loading: false
			});
		} catch (e) {
			log(e);
			this.setState({ loading: false });
		}
	};

	onSearchPress = () => {
		this.setState({ isSearching: true }, () => this.setHeader());
	};

	onCancelSearchPress = () => {
		this.setState({ isSearching: false, searchText: '' }, () => {
			const { subscription } = this.state;
			this.setHeader();
			this.subscribeMessages(subscription);
		});
	};

	onSearchChangeText = debounce((searchText: string) => {
		const { subscription } = this.state;
		this.setState({ searchText }, () => this.subscribeMessages(subscription, searchText));
	}, 300);

	onThreadPress = debounce(
		(item: any) => {
			const { subscription } = this.state;
			const { navigation, isMasterDetail } = this.props;
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

	getBadgeColor = (item: TThreadModel) => {
		const { subscription } = this.state;
		const { theme } = this.props;
		return getBadgeColor({ subscription, theme, messageId: item?.id });
	};

	// helper to query threads
	getFilteredThreads = (messages: TThreadModel[], subscription?: TSubscriptionModel, currentFilter?: Filter): TThreadModel[] => {
		const { user } = this.props;
		if (currentFilter === Filter.Following) {
			return messages?.filter(item => item?.replies?.find(u => u === user.id));
		}
		if (currentFilter === Filter.Unread) {
			return messages?.filter(item => subscription?.tunread?.includes(item?.id));
		}
		return messages;
	};

	showFilters = () => {
		const { currentFilter } = this.state;
		showActionSheetRef({
			options: [
				{
					title: I18n.t(Filter.All),
					right: currentFilter === Filter.All ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => this.onFilterSelected(Filter.All)
				},
				{
					title: I18n.t(Filter.Following),
					right: currentFilter === Filter.Following ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => this.onFilterSelected(Filter.Following)
				},
				{
					title: I18n.t(Filter.Unread),
					right: currentFilter === Filter.Unread ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => this.onFilterSelected(Filter.Unread)
				}
			]
		});
	};

	onFilterSelected = (filter: Filter) => {
		const { messages, subscription } = this.state;
		const displayingThreads = this.getFilteredThreads(messages, subscription, filter);
		this.setState({ currentFilter: filter, displayingThreads });
		UserPreferences.setString(THREADS_FILTER, filter);
	};

	toggleFollowThread = async (isFollowingThread: boolean, tmid: string) => {
		try {
			await Services.toggleFollowMessage(tmid, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
		} catch (e) {
			log(e);
		}
	};

	renderItem = ({ item }: { item: TThreadModel }) => {
		const { user, navigation, useRealName } = this.props;
		const badgeColor = this.getBadgeColor(item);
		return (
			<Item
				{...{
					item,
					user,
					navigation,
					useRealName,
					badgeColor
				}}
				onPress={this.onThreadPress}
				toggleFollowThread={this.toggleFollowThread}
			/>
		);
	};

	renderContent = () => {
		const { loading, messages, displayingThreads, currentFilter } = this.state;
		const { theme } = this.props;
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
				data={displayingThreads}
				extraData={this.state}
				renderItem={this.renderItem}
				style={[styles.list, { backgroundColor: themes[theme].surfaceRoom }]}
				contentContainerStyle={styles.contentContainer}
				onEndReached={this.load}
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

	render() {
		console.count(`${this.constructor.name}.render calls`);
		return (
			<SafeAreaView testID='thread-messages-view'>
				<StatusBar />
				{this.renderContent()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	useRealName: state.settings.UI_Use_Real_Name as boolean,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(ThreadMessagesView));

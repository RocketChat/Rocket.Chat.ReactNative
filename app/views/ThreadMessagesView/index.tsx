import React from 'react';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { EdgeInsets, withSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBackButton, StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Observable, Subscription } from 'rxjs';

import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import StatusBar from '../../containers/StatusBar';
import buildMessage from '../../lib/methods/helpers/buildMessage';
import log from '../../utils/log';
import debounce from '../../utils/debounce';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import BackgroundContainer from '../../containers/BackgroundContainer';
import { isIOS } from '../../utils/deviceInfo';
import { getBadgeColor, makeThreadName } from '../../utils/room';
import { getHeaderTitlePosition } from '../../containers/Header';
import EventEmitter from '../../utils/events';
import { LISTENER } from '../../containers/Toast';
import SearchHeader from '../../containers/SearchHeader';
import { ChatsStackParamList } from '../../stacks/types';
import { Filter } from './filters';
import DropdownItemHeader from './Dropdown/DropdownItemHeader';
import Dropdown from './Dropdown';
import Item from './Item';
import styles from './styles';
import { IMessage, SubscriptionType, TSubscriptionModel, TThreadModel } from '../../definitions';

const API_FETCH_COUNT = 50;

// interface IResultFetch {
// 	threads: IThreadResult[];
// 	count: number;
// 	offset: number;
// 	total: number;
// 	success: boolean;
// }

interface IThreadMessagesViewState {
	loading: boolean;
	end: boolean;
	messages: any[];
	displayingThreads: TThreadModel[];
	subscription: TSubscriptionModel;
	showFilterDropdown: boolean;
	currentFilter: Filter;
	isSearching: boolean;
	searchText: string;
}

interface IThreadMessagesViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'ThreadMessagesView'>;
	route: RouteProp<ChatsStackParamList, 'ThreadMessagesView'>;
	user: any;
	baseUrl: string;
	useRealName: boolean;
	theme: string;
	isMasterDetail: boolean;
	insets: EdgeInsets;
}

class ThreadMessagesView extends React.Component<IThreadMessagesViewProps, IThreadMessagesViewState> {
	private mounted: boolean;

	private rid: string;

	private t: string;

	private subSubscription: any;

	private messagesSubscription?: Subscription;

	private messagesObservable?: Observable<TThreadModel[]>;

	constructor(props: IThreadMessagesViewProps) {
		super(props);
		this.mounted = false;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.state = {
			loading: false,
			end: false,
			messages: [],
			displayingThreads: [],
			subscription: {} as TSubscriptionModel,
			showFilterDropdown: false,
			currentFilter: Filter.All,
			isSearching: false,
			searchText: ''
		};
		this.setHeader();
		this.initSubscription();
		this.subscribeMessages();
	}

	componentDidMount() {
		this.mounted = true;
		this.init();
	}

	componentDidUpdate(prevProps: IThreadMessagesViewProps) {
		const { insets } = this.props;
		if (insets.left !== prevProps.insets.left || insets.right !== prevProps.insets.right) {
			this.setHeader();
		}
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

	getHeader = (): StackNavigationOptions => {
		const { isSearching } = this.state;
		const { navigation, isMasterDetail, insets, theme } = this.props;

		if (isSearching) {
			const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: 1 });
			return {
				headerTitleAlign: 'left',
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={this.onCancelSearchPress} />
					</HeaderButton.Container>
				),
				headerTitle: () => (
					<SearchHeader onSearchChangeText={this.onSearchChangeText} testID='thread-messages-view-search-header' />
				),
				headerTitleContainerStyle: {
					left: headerTitlePosition.left,
					right: headerTitlePosition.right
				},
				headerRight: () => null
			};
		}

		const options: StackNavigationOptions = {
			headerLeft: () => (
				<HeaderBackButton labelVisible={false} onPress={() => navigation.pop()} tintColor={themes[theme].headerTintColor} />
			),
			headerTitleAlign: 'center',
			headerTitle: I18n.t('Threads'),
			headerTitleContainerStyle: {
				left: null,
				right: null
			}
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		options.headerRight = () => (
			<HeaderButton.Container>
				<HeaderButton.Item iconName='search' onPress={this.onSearchPress} />
			</HeaderButton.Container>
		);
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

			const whereClause = [Q.where('rid', this.rid), Q.experimentalSortBy('tlm', Q.desc)];

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

	init = () => {
		const { subscription } = this.state;
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
		if (!subscription) {
			this.setState(({ messages }) => ({ messages: [...messages, ...update] }));
			return;
		}

		try {
			const db = database.active;
			const threadsCollection = db.get('threads');
			const allThreadsRecords = await subscription.threads.fetch();
			let threadsToCreate: any[] = [];
			let threadsToUpdate: any[] = [];
			let threadsToDelete: any[] = [];

			if (remove && remove.length) {
				threadsToDelete = allThreadsRecords.filter((i1: { id: string }) => remove.find(i2 => i1.id === i2._id));
				threadsToDelete = threadsToDelete.map(t => t.prepareDestroyPermanently());
			}

			if (update && update.length) {
				update = update.map(m => buildMessage(m)) as IMessage[];
				// filter threads
				threadsToCreate = update.filter(i1 => !allThreadsRecords.find((i2: { id: string }) => i1._id === i2.id));
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
					const newThread = update.find(t => t._id === thread.id);
					try {
						return thread.prepareUpdate(
							protectedFunction((t: any) => {
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
					subscription.prepareUpdate((s: any) => {
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
		const { loading, end, messages, searchText } = this.state;
		if (end || loading || !this.mounted) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await RocketChat.getThreadsList({
				rid: this.rid,
				count: API_FETCH_COUNT,
				offset: messages.length,
				text: searchText
			});
			if (result.success) {
				this.updateThreads({ update: result.threads, lastThreadSync });
				this.setState({
					loading: false,
					end: result.count < API_FETCH_COUNT
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
			const result = await RocketChat.getSyncThreadsList({
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
				roomUserId: RocketChat.getUidDirectMessage(subscription)
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
		// const { currentFilter } = this.state;
		const { user } = this.props;
		if (currentFilter === Filter.Following) {
			return messages?.filter(item => item?.replies?.find(u => u === user.id));
		}
		if (currentFilter === Filter.Unread) {
			return messages?.filter(item => subscription?.tunread?.includes(item?.id));
		}
		return messages;
	};

	// method to update state with filtered threads
	filterThreads = () => {
		const { messages, subscription } = this.state;
		const displayingThreads = this.getFilteredThreads(messages, subscription);
		this.setState({ displayingThreads });
	};

	showFilterDropdown = () => this.setState({ showFilterDropdown: true });

	closeFilterDropdown = () => this.setState({ showFilterDropdown: false });

	onFilterSelected = (filter: Filter) => {
		const { messages, subscription } = this.state;
		const displayingThreads = this.getFilteredThreads(messages, subscription, filter);
		this.setState({ currentFilter: filter, displayingThreads });
	};

	toggleFollowThread = async (isFollowingThread: boolean, tmid: string) => {
		try {
			await RocketChat.toggleFollowMessage(tmid, !isFollowingThread);
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

	renderHeader = () => {
		const { messages, currentFilter } = this.state;
		if (!messages.length) {
			return null;
		}

		return (
			<>
				<DropdownItemHeader currentFilter={currentFilter} onPress={this.showFilterDropdown} />
				<List.Separator />
			</>
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
			return (
				<>
					{this.renderHeader()}
					<BackgroundContainer text={text} />
				</>
			);
		}

		return (
			<FlatList
				data={displayingThreads}
				extraData={this.state}
				renderItem={this.renderItem}
				style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
				contentContainerStyle={styles.contentContainer}
				onEndReached={this.load}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				initialNumToRender={7}
				removeClippedSubviews={isIOS}
				ItemSeparatorComponent={List.Separator}
				ListHeaderComponent={this.renderHeader}
				ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
				scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
			/>
		);
	};

	render() {
		console.count(`${this.constructor.name}.render calls`);
		const { showFilterDropdown, currentFilter } = this.state;

		return (
			<SafeAreaView testID='thread-messages-view'>
				<StatusBar />
				{this.renderContent()}
				{showFilterDropdown ? (
					<Dropdown currentFilter={currentFilter} onFilterSelected={this.onFilterSelected} onClose={this.closeFilterDropdown} />
				) : null}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: any) => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	useRealName: state.settings.UI_Use_Real_Name,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(withSafeAreaInsets(ThreadMessagesView)));

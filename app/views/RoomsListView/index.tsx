import React from 'react';
import { BackHandler, FlatList, Keyboard, NativeEventSubscription, RefreshControl, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { dequal } from 'dequal';
import Orientation from 'react-native-orientation-locker';
import { Q } from '@nozbe/watermelondb';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { Subscription } from 'rxjs';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { Header } from '@react-navigation/elements';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { Dispatch } from 'redux';

import database from '../../lib/database';
import RoomItem, { ROW_HEIGHT, ROW_HEIGHT_CONDENSED } from '../../containers/RoomItem';
import log, { logEvent, events } from '../../lib/methods/helpers/log';
import I18n from '../../i18n';
import { closeSearchHeader, closeServerDropdown, openSearchHeader, roomsRequest } from '../../actions/rooms';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { animateNextTransition } from '../../lib/methods/helpers/layoutAnimation';
import { TSupportedThemes, withTheme } from '../../theme';
import { themedHeader } from '../../lib/methods/helpers/navigation';
import { getUserSelector } from '../../selectors/login';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import SafeAreaView from '../../containers/SafeAreaView';
import { withDimensions } from '../../dimensions';
import { getInquiryQueueSelector } from '../../ee/omnichannel/selectors/inquiry';
import { IApplicationState, ISubscription, IUser, SubscriptionType, TSubscriptionModel } from '../../definitions';
import styles from './styles';
import ServerDropdown from './ServerDropdown';
import ListHeader, { TEncryptionBanner } from './ListHeader';
import RoomsListHeaderView from './Header';
import { ChatsStackParamList, DrawerParamList } from '../../stacks/types';
import { RoomTypes, search } from '../../lib/methods';
import {
	getRoomAvatar,
	getRoomTitle,
	getUidDirectMessage,
	hasPermission,
	isRead,
	debounce,
	isIOS,
	isTablet
} from '../../lib/methods/helpers';
import { E2E_BANNER_TYPE, DisplayMode, SortBy, MAX_SIDEBAR_WIDTH, themes } from '../../lib/constants';
import { Services } from '../../lib/services';

type TNavigation = CompositeNavigationProp<
	StackNavigationProp<ChatsStackParamList, 'RoomsListView'>,
	CompositeNavigationProp<StackNavigationProp<ChatsStackParamList>, StackNavigationProp<DrawerParamList>>
>;

interface IRoomsListViewProps {
	navigation: TNavigation;
	route: RouteProp<ChatsStackParamList, 'RoomsListView'>;
	theme: TSupportedThemes;
	dispatch: Dispatch;
	[key: string]: IUser | string | boolean | ISubscription[] | number | object | TEncryptionBanner;
	user: IUser;
	server: string;
	searchText: string;
	changingServer: boolean;
	loadingServer: boolean;
	showServerDropdown: boolean;
	sortBy: string;
	groupByType: boolean;
	showFavorites: boolean;
	showUnread: boolean;
	refreshing: boolean;
	StoreLastMessage: boolean;
	useRealName: boolean;
	isMasterDetail: boolean;
	notificationPresenceCap: boolean;
	subscribedRoom: string;
	width: number;
	insets: {
		left: number;
		right: number;
	};
	queueSize: number;
	inquiryEnabled: boolean;
	encryptionBanner: TEncryptionBanner;
	showAvatar: boolean;
	displayMode: string;
	createTeamPermission: [];
	createDirectMessagePermission: [];
	createPublicChannelPermission: [];
	createPrivateChannelPermission: [];
	createDiscussionPermission: [];
}

interface IRoomsListViewState {
	searching?: boolean;
	search?: IRoomItem[];
	loading?: boolean;
	chatsUpdate?: string[] | { rid: string; alert?: boolean }[];
	omnichannelsUpdate?: string[];
	chats?: IRoomItem[];
	item?: ISubscription;
	canCreateRoom?: boolean;
}

interface IRoomItem extends ISubscription {
	search?: boolean;
	outside?: boolean;
}

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;
const CHATS_HEADER = 'Chats';
const UNREAD_HEADER = 'Unread';
const FAVORITES_HEADER = 'Favorites';
const DISCUSSIONS_HEADER = 'Discussions';
const TEAMS_HEADER = 'Teams';
const CHANNELS_HEADER = 'Channels';
const DM_HEADER = 'Direct_Messages';
const OMNICHANNEL_HEADER_IN_PROGRESS = 'Open_Livechats';
const OMNICHANNEL_HEADER_ON_HOLD = 'On_hold_Livechats';
const QUERY_SIZE = 20;

const filterIsUnread = (s: TSubscriptionModel) => (s.unread > 0 || s.tunread?.length > 0 || s.alert) && !s.hideUnreadStatus;
const filterIsFavorite = (s: TSubscriptionModel) => s.f;
const filterIsOmnichannel = (s: TSubscriptionModel) => s.t === 'l';
const filterIsTeam = (s: TSubscriptionModel) => s.teamMain;
const filterIsDiscussion = (s: TSubscriptionModel) => s.prid;

const shouldUpdateProps = [
	'searchText',
	'loadingServer',
	'showServerDropdown',
	'useRealName',
	'StoreLastMessage',
	'theme',
	'isMasterDetail',
	'notificationPresenceCap',
	'refreshing',
	'queueSize',
	'inquiryEnabled',
	'encryptionBanner',
	'createTeamPermission',
	'createDirectMessagePermission',
	'createPublicChannelPermission',
	'createPrivateChannelPermission',
	'createDiscussionPermission'
];

const sortPreferencesShouldUpdate = ['sortBy', 'groupByType', 'showFavorites', 'showUnread'];

const displayPropsShouldUpdate = ['showAvatar', 'displayMode'];

const getItemLayout = (data: ISubscription[] | null | undefined, index: number, height: number) => ({
	length: height,
	offset: height * index,
	index
});
const keyExtractor = (item: ISubscription) => item.rid;

class RoomsListView extends React.Component<IRoomsListViewProps, IRoomsListViewState> {
	private animated: boolean;
	private count: number;
	private unsubscribeFocus?: () => void;
	private unsubscribeBlur?: () => void;
	private sortPreferencesChanged?: boolean;
	private shouldUpdate?: boolean;
	private backHandler?: NativeEventSubscription;
	private querySubscription?: Subscription;
	private scroll?: FlatList;
	private useRealName?: boolean;

	constructor(props: IRoomsListViewProps) {
		super(props);
		console.time(`${this.constructor.name} init`);
		console.time(`${this.constructor.name} mount`);

		this.animated = false;
		this.count = 0;
		this.state = {
			searching: false,
			search: [],
			loading: true,
			chatsUpdate: [] as TSubscriptionModel[],
			omnichannelsUpdate: [],
			chats: [],
			item: {} as ISubscription,
			canCreateRoom: false
		};
		this.setHeader();
		this.getSubscriptions();
	}

	componentDidMount() {
		const { navigation, dispatch } = this.props;
		this.handleHasPermission();
		this.unsubscribeFocus = navigation.addListener('focus', () => {
			Orientation.unlockAllOrientations();
			this.animated = true;
			// Check if there were changes with sort preference, then call getSubscription to remount the list
			if (this.sortPreferencesChanged) {
				this.getSubscriptions();
				this.sortPreferencesChanged = false;
			}
			// Check if there were changes while not focused (it's set on sCU)
			if (this.shouldUpdate) {
				this.forceUpdate();
				this.shouldUpdate = false;
			}
			this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
		});
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			this.animated = false;
			dispatch(closeServerDropdown());
			this.cancelSearch();
			if (this.backHandler && this.backHandler.remove) {
				this.backHandler.remove();
			}
		});
		console.timeEnd(`${this.constructor.name} mount`);
	}

	UNSAFE_componentWillReceiveProps(nextProps: IRoomsListViewProps) {
		const { loadingServer, searchText, server, changingServer } = this.props;

		// when the server is changed
		if (server !== nextProps.server && loadingServer !== nextProps.loadingServer && nextProps.loadingServer) {
			this.setState({ loading: true });
		}
		// when the server is changing and stopped loading
		if (changingServer && loadingServer !== nextProps.loadingServer && !nextProps.loadingServer) {
			this.getSubscriptions();
		}
		if (searchText !== nextProps.searchText) {
			this.handleSearch(nextProps.searchText);
		}
	}

	shouldComponentUpdate(nextProps: IRoomsListViewProps, nextState: IRoomsListViewState) {
		const { chatsUpdate, searching, item, canCreateRoom, omnichannelsUpdate } = this.state;
		const propsUpdated = shouldUpdateProps.some(key => nextProps[key] !== this.props[key]);
		if (propsUpdated) {
			return true;
		}

		// check if some display props are changed to force update when focus this view again
		const displayUpdated = displayPropsShouldUpdate.some(key => nextProps[key] !== this.props[key]);
		if (displayUpdated) {
			this.shouldUpdate = true;
		}

		// check if some sort preferences are changed to getSubscription() when focus this view again
		const sortPreferencesUpdate = sortPreferencesShouldUpdate.some(key => nextProps[key] !== this.props[key]);
		if (sortPreferencesUpdate) {
			this.sortPreferencesChanged = true;
		}

		// Compare changes only once
		const chatsNotEqual = !dequal(nextState.chatsUpdate, chatsUpdate);

		// If they aren't equal, set to update if focused
		if (chatsNotEqual) {
			this.shouldUpdate = true;
		}

		const omnichannelsNotEqual = !dequal(nextState.omnichannelsUpdate, omnichannelsUpdate);

		if (omnichannelsNotEqual) {
			this.shouldUpdate = true;
		}

		if (nextState.searching !== searching) {
			return true;
		}

		if (nextState.canCreateRoom !== canCreateRoom) {
			return true;
		}

		if (nextState.item?.rid !== item?.rid) {
			return true;
		}

		// Abort if it's not focused
		if (!nextProps.navigation.isFocused()) {
			return false;
		}

		const { loading, search } = this.state;
		const { width, insets, subscribedRoom } = this.props;
		if (nextState.loading !== loading) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (!dequal(nextState.search, search)) {
			return true;
		}
		if (nextProps.subscribedRoom !== subscribedRoom) {
			return true;
		}
		if (!dequal(nextProps.insets, insets)) {
			return true;
		}
		// If it's focused and there are changes, update
		if (chatsNotEqual || omnichannelsNotEqual) {
			this.shouldUpdate = false;
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps: IRoomsListViewProps) {
		const {
			sortBy,
			groupByType,
			showFavorites,
			showUnread,
			subscribedRoom,
			isMasterDetail,
			notificationPresenceCap,
			insets,
			createTeamPermission,
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createDirectMessagePermission,
			createDiscussionPermission,
			showAvatar,
			displayMode
		} = this.props;
		const { item } = this.state;

		if (
			!(
				prevProps.sortBy === sortBy &&
				prevProps.groupByType === groupByType &&
				prevProps.showFavorites === showFavorites &&
				prevProps.showUnread === showUnread &&
				prevProps.showAvatar === showAvatar &&
				prevProps.displayMode === displayMode
			)
		) {
			this.getSubscriptions();
		}
		// Update current item in case of another action triggers an update on room subscribed reducer
		if (isMasterDetail && item?.rid !== subscribedRoom && subscribedRoom !== prevProps.subscribedRoom) {
			this.setState({ item: { rid: subscribedRoom } as ISubscription });
		}
		if (
			insets.left !== prevProps.insets.left ||
			insets.right !== prevProps.insets.right ||
			notificationPresenceCap !== prevProps.notificationPresenceCap
		) {
			this.setHeader();
		}

		if (
			!dequal(createTeamPermission, prevProps.createTeamPermission) ||
			!dequal(createPublicChannelPermission, prevProps.createPublicChannelPermission) ||
			!dequal(createPrivateChannelPermission, prevProps.createPrivateChannelPermission) ||
			!dequal(createDirectMessagePermission, prevProps.createDirectMessagePermission) ||
			!dequal(createDiscussionPermission, prevProps.createDiscussionPermission)
		) {
			this.handleHasPermission();
			this.setHeader();
		}
	}

	componentWillUnmount() {
		this.unsubscribeQuery();
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
		if (this.backHandler && this.backHandler.remove) {
			this.backHandler.remove();
		}
		console.countReset(`${this.constructor.name}.render calls`);
	}

	handleHasPermission = async () => {
		const {
			createTeamPermission,
			createDirectMessagePermission,
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createDiscussionPermission
		} = this.props;
		const permissions = [
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createTeamPermission,
			createDirectMessagePermission,
			createDiscussionPermission
		];
		const permissionsToCreate = await hasPermission(permissions);
		const canCreateRoom = permissionsToCreate.filter((r: boolean) => r === true).length > 0;
		this.setState({ canCreateRoom }, () => this.setHeader());
	};

	getHeader = (): StackNavigationOptions => {
		const { searching, canCreateRoom } = this.state;
		const { navigation, isMasterDetail, notificationPresenceCap } = this.props;
		if (searching) {
			return {
				headerTitleAlign: 'left',
				headerTitleContainerStyle: { flex: 1, marginHorizontal: 0, marginRight: 15, maxWidth: undefined },
				headerRightContainerStyle: { flexGrow: 0 },
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={this.cancelSearch} />
					</HeaderButton.Container>
				),
				headerTitle: () => <RoomsListHeaderView />,
				headerRight: () => null
			};
		}

		return {
			headerTitleAlign: 'left',
			headerTitleContainerStyle: { flex: 1, marginHorizontal: 4, maxWidth: undefined },
			headerRightContainerStyle: { flexGrow: undefined, flexBasis: undefined },
			headerLeft: () => (
				<HeaderButton.Drawer
					navigation={navigation}
					testID='rooms-list-view-sidebar'
					onPress={
						isMasterDetail
							? () => navigation.navigate('ModalStackNavigator', { screen: 'SettingsView' })
							: // @ts-ignore
							  () => navigation.toggleDrawer()
					}
					badge={() => (notificationPresenceCap ? <HeaderButton.BadgeWarn /> : null)}
				/>
			),
			headerTitle: () => <RoomsListHeaderView />,
			headerRight: () => (
				<HeaderButton.Container>
					{canCreateRoom ? (
						<HeaderButton.Item iconName='create' onPress={this.goToNewMessage} testID='rooms-list-view-create-channel' />
					) : null}
					<HeaderButton.Item iconName='search' onPress={this.initSearching} testID='rooms-list-view-search' />
					<HeaderButton.Item iconName='directory' onPress={this.goDirectory} testID='rooms-list-view-directory' />
				</HeaderButton.Container>
			)
		};
	};

	setHeader = () => {
		const { navigation } = this.props;
		const options = this.getHeader();
		navigation.setOptions(options);
	};

	internalSetState = (
		state:
			| ((
					prevState: Readonly<IRoomsListViewState>,
					props: Readonly<IRoomsListViewProps>
			  ) => Pick<IRoomsListViewState, keyof IRoomsListViewState> | IRoomsListViewState | null)
			| (Pick<IRoomsListViewState, keyof IRoomsListViewState> | IRoomsListViewState | null),
		callback?: () => void
	) => {
		if (this.animated) {
			animateNextTransition();
		}
		this.setState(state, callback);
	};

	addRoomsGroup = (data: TSubscriptionModel[], header: string, allData: TSubscriptionModel[]) => {
		if (data.length > 0) {
			if (header) {
				allData.push({ rid: header, separator: true } as TSubscriptionModel);
			}
			allData = allData.concat(data);
		}
		return allData;
	};

	getSubscriptions = async () => {
		this.unsubscribeQuery();

		const { sortBy, showUnread, showFavorites, groupByType, user } = this.props;

		const db = database.active;
		let observable;

		const defaultWhereClause = [Q.where('archived', false), Q.where('open', true)] as (Q.WhereDescription | Q.SortBy)[];

		if (sortBy === SortBy.Alphabetical) {
			defaultWhereClause.push(Q.sortBy(`${this.useRealName ? 'fname' : 'name'}`, Q.asc));
		} else {
			defaultWhereClause.push(Q.sortBy('room_updated_at', Q.desc));
		}

		// When we're grouping by something
		if (this.isGrouping) {
			observable = await db
				.get('subscriptions')
				.query(...defaultWhereClause)
				.observeWithColumns(['alert', 'on_hold']);
			// When we're NOT grouping
		} else {
			this.count += QUERY_SIZE;
			observable = await db
				.get('subscriptions')
				.query(...defaultWhereClause, Q.skip(0), Q.take(this.count))
				.observeWithColumns(['on_hold']);
		}

		this.querySubscription = observable.subscribe(data => {
			let tempChats = [] as TSubscriptionModel[];
			let chats = data;

			let omnichannelsUpdate: string[] = [];
			const isOmnichannelAgent = user?.roles?.includes('livechat-agent');
			if (isOmnichannelAgent) {
				const omnichannel = chats.filter(s => filterIsOmnichannel(s));
				const omnichannelInProgress = omnichannel.filter(s => !s.onHold);
				const omnichannelOnHold = omnichannel.filter(s => s.onHold);
				chats = chats.filter(s => !filterIsOmnichannel(s));
				omnichannelsUpdate = omnichannelInProgress.map(s => s.rid);
				tempChats = this.addRoomsGroup(omnichannelInProgress, OMNICHANNEL_HEADER_IN_PROGRESS, tempChats);
				tempChats = this.addRoomsGroup(omnichannelOnHold, OMNICHANNEL_HEADER_ON_HOLD, tempChats);
			}

			// unread
			if (showUnread) {
				const unread = chats.filter(s => filterIsUnread(s));
				chats = chats.filter(s => !filterIsUnread(s));
				tempChats = this.addRoomsGroup(unread, UNREAD_HEADER, tempChats);
			}

			// favorites
			if (showFavorites) {
				const favorites = chats.filter(s => filterIsFavorite(s));
				chats = chats.filter(s => !filterIsFavorite(s));
				tempChats = this.addRoomsGroup(favorites, FAVORITES_HEADER, tempChats);
			}

			// type
			if (groupByType) {
				const teams = chats.filter(s => filterIsTeam(s));
				const discussions = chats.filter(s => filterIsDiscussion(s));
				const channels = chats.filter(s => (s.t === 'c' || s.t === 'p') && !filterIsDiscussion(s) && !filterIsTeam(s));
				const direct = chats.filter(s => s.t === 'd' && !filterIsDiscussion(s) && !filterIsTeam(s));
				tempChats = this.addRoomsGroup(teams, TEAMS_HEADER, tempChats);
				tempChats = this.addRoomsGroup(discussions, DISCUSSIONS_HEADER, tempChats);
				tempChats = this.addRoomsGroup(channels, CHANNELS_HEADER, tempChats);
				tempChats = this.addRoomsGroup(direct, DM_HEADER, tempChats);
			} else if (showUnread || showFavorites || isOmnichannelAgent) {
				tempChats = this.addRoomsGroup(chats, CHATS_HEADER, tempChats);
			} else {
				tempChats = chats;
			}

			const chatsUpdate = tempChats.map(item => item.rid);

			this.internalSetState({
				chats: tempChats,
				chatsUpdate,
				omnichannelsUpdate,
				loading: false
			});
		});
	};

	unsubscribeQuery = () => {
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	};

	initSearching = () => {
		logEvent(events.RL_SEARCH);
		const { dispatch, showServerDropdown } = this.props;
		this.internalSetState({ searching: true }, () => {
			if (showServerDropdown) {
				dispatch(closeServerDropdown());
			}
			dispatch(openSearchHeader());
			this.handleSearch('');
			this.setHeader();
		});
	};

	cancelSearch = () => {
		const { searching } = this.state;
		const { dispatch } = this.props;

		if (!searching) {
			return;
		}

		Keyboard.dismiss();

		this.setState({ searching: false, search: [] }, () => {
			this.setHeader();
			dispatch(closeSearchHeader());
			setTimeout(() => {
				this.scrollToTop();
			}, 200);
		});
	};

	handleBackPress = () => {
		const { searching } = this.state;
		if (searching) {
			this.cancelSearch();
			return true;
		}
		return false;
	};

	// eslint-disable-next-line react/sort-comp
	handleSearch = debounce(async (text: string) => {
		const result = await search({ text });

		// if the search was cancelled before the promise is resolved
		const { searching } = this.state;
		if (!searching) {
			return;
		}
		this.internalSetState({
			search: result as IRoomItem[],
			searching: true
		});
		this.scrollToTop();
	}, 300);

	isSwipeEnabled = (item: IRoomItem) => !(item?.search || item?.joinCodeRequired || item?.outside);

	get isGrouping() {
		const { showUnread, showFavorites, groupByType } = this.props;
		return showUnread || showFavorites || groupByType;
	}

	onPressItem = (item = {} as ISubscription) => {
		const { navigation, isMasterDetail } = this.props;
		if (!navigation.isFocused()) {
			return;
		}

		this.cancelSearch();
		this.goRoom({ item, isMasterDetail });
	};

	scrollToTop = () => {
		if (this.scroll?.scrollToOffset) {
			this.scroll.scrollToOffset({ offset: 0 });
		}
	};

	toggleFav = async (rid: string, favorite: boolean): Promise<void> => {
		logEvent(favorite ? events.RL_UNFAVORITE_CHANNEL : events.RL_FAVORITE_CHANNEL);
		try {
			const db = database.active;
			const result = await Services.toggleFavorite(rid, !favorite);
			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update(sub => {
							sub.f = !favorite;
						});
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			logEvent(events.RL_TOGGLE_FAVORITE_F);
			log(e);
		}
	};

	toggleRead = async (rid: string, tIsRead: boolean) => {
		logEvent(tIsRead ? events.RL_UNREAD_CHANNEL : events.RL_READ_CHANNEL);
		try {
			const db = database.active;
			const result = await Services.toggleRead(tIsRead, rid);

			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update(sub => {
							sub.alert = tIsRead;
							sub.unread = 0;
						});
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			logEvent(events.RL_TOGGLE_READ_F);
			log(e);
		}
	};

	hideChannel = async (rid: string, type: SubscriptionType) => {
		logEvent(events.RL_HIDE_CHANNEL);
		try {
			const db = database.active;
			const result = await Services.hideRoom(rid, type as RoomTypes);
			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.destroyPermanently();
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			logEvent(events.RL_HIDE_CHANNEL_F);
			log(e);
		}
	};

	goDirectory = () => {
		logEvent(events.RL_GO_DIRECTORY);
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'DirectoryView' });
		} else {
			navigation.navigate('DirectoryView');
		}
	};

	goQueue = () => {
		logEvent(events.RL_GO_QUEUE);
		const { navigation, isMasterDetail, inquiryEnabled } = this.props;

		if (!inquiryEnabled) {
			return;
		}

		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'QueueListView' });
		} else {
			navigation.navigate('QueueListView');
		}
	};

	goRoom = ({ item, isMasterDetail }: { item: ISubscription; isMasterDetail: boolean }) => {
		logEvent(events.RL_GO_ROOM);
		const { item: currentItem } = this.state;
		const { subscribedRoom } = this.props;

		if (currentItem?.rid === item.rid || subscribedRoom === item.rid) {
			return;
		}
		// Only mark room as focused when in master detail layout
		if (isMasterDetail) {
			this.setState({ item });
		}
		goRoom({ item, isMasterDetail });
	};

	goToNewMessage = () => {
		logEvent(events.RL_GO_NEW_MSG);
		const { navigation, isMasterDetail } = this.props;

		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'NewMessageView' });
		} else {
			navigation.navigate('NewMessageStackNavigator');
		}
	};

	goEncryption = () => {
		logEvent(events.RL_GO_E2E_SAVE_PASSWORD);
		const { navigation, isMasterDetail, encryptionBanner } = this.props;

		const isSavePassword = encryptionBanner === E2E_BANNER_TYPE.SAVE_PASSWORD;
		if (isMasterDetail) {
			const screen = isSavePassword ? 'E2ESaveYourPasswordView' : 'E2EEnterYourPasswordView';
			navigation.navigate('ModalStackNavigator', { screen });
		} else {
			const screen = isSavePassword ? 'E2ESaveYourPasswordStackNavigator' : 'E2EEnterYourPasswordStackNavigator';
			navigation.navigate(screen);
		}
	};

	onRefresh = () => {
		const { searching } = this.state;
		const { dispatch } = this.props;
		if (searching) {
			return;
		}
		dispatch(roomsRequest({ allData: true }));
	};

	onEndReached = () => {
		// Run only when we're not grouping by anything
		if (!this.isGrouping) {
			this.getSubscriptions();
		}
	};

	getScrollRef = (ref: FlatList) => (this.scroll = ref);

	renderListHeader = () => {
		const { searching } = this.state;
		const { queueSize, inquiryEnabled, encryptionBanner, user } = this.props;
		return (
			<ListHeader
				searching={searching as boolean}
				goEncryption={this.goEncryption}
				goQueue={this.goQueue}
				queueSize={queueSize}
				inquiryEnabled={inquiryEnabled}
				encryptionBanner={encryptionBanner}
				user={user}
			/>
		);
	};

	renderHeader = () => {
		const { isMasterDetail, theme } = this.props;

		if (!isMasterDetail) {
			return null;
		}

		const options = this.getHeader();
		return <Header title='' {...themedHeader(theme)} {...options} />;
	};

	renderItem = ({ item }: { item: IRoomItem }) => {
		if (item.separator) {
			return this.renderSectionHeader(item.rid);
		}

		const { item: currentItem } = this.state;
		const {
			user: { username },
			StoreLastMessage,
			useRealName,
			isMasterDetail,
			width,
			showAvatar,
			displayMode
		} = this.props;
		const id = getUidDirectMessage(item);
		const swipeEnabled = this.isSwipeEnabled(item);

		return (
			<RoomItem
				item={item}
				id={id}
				username={username}
				showLastMessage={StoreLastMessage}
				onPress={this.onPressItem}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				toggleFav={this.toggleFav}
				toggleRead={this.toggleRead}
				hideChannel={this.hideChannel}
				useRealName={useRealName}
				getRoomTitle={getRoomTitle}
				getRoomAvatar={getRoomAvatar}
				getIsRead={isRead}
				isFocused={currentItem?.rid === item.rid}
				swipeEnabled={swipeEnabled}
				showAvatar={showAvatar}
				displayMode={displayMode}
			/>
		);
	};

	renderSectionHeader = (header: string) => {
		const { theme } = this.props;
		return (
			<View style={[styles.groupTitleContainer, { backgroundColor: themes[theme].backgroundColor }]}>
				<Text style={[styles.groupTitle, { color: themes[theme].controlText }]}>{I18n.t(header)}</Text>
			</View>
		);
	};

	renderScroll = () => {
		const { loading, chats, search, searching } = this.state;
		const { theme, refreshing, displayMode } = this.props;

		const height = displayMode === DisplayMode.Condensed ? ROW_HEIGHT_CONDENSED : ROW_HEIGHT;

		if (loading) {
			return <ActivityIndicator />;
		}

		return (
			<FlatList
				ref={this.getScrollRef}
				data={searching ? search : chats}
				extraData={searching ? search : chats}
				keyExtractor={keyExtractor}
				style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
				renderItem={this.renderItem}
				ListHeaderComponent={this.renderListHeader}
				getItemLayout={(data, index) => getItemLayout(data, index, height)}
				removeClippedSubviews={isIOS}
				keyboardShouldPersistTaps='always'
				initialNumToRender={INITIAL_NUM_TO_RENDER}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} tintColor={themes[theme].auxiliaryText} />
				}
				windowSize={9}
				onEndReached={this.onEndReached}
				onEndReachedThreshold={0.5}
			/>
		);
	};

	render = () => {
		console.count(`${this.constructor.name}.render calls`);
		const { showServerDropdown, theme, navigation } = this.props;

		return (
			<SafeAreaView testID='rooms-list-view' style={{ backgroundColor: themes[theme].backgroundColor }}>
				<StatusBar />
				{this.renderHeader()}
				{this.renderScroll()}
				{/* TODO - this ts-ignore is here because the route props, on IBaseScreen*/}
				{/* @ts-ignore*/}
				{showServerDropdown ? <ServerDropdown navigation={navigation} theme={theme} /> : null}
			</SafeAreaView>
		);
	};
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	notificationPresenceCap: state.app.notificationPresenceCap,
	server: state.server.server,
	changingServer: state.server.changingServer,
	searchText: state.rooms.searchText,
	loadingServer: state.server.loading,
	showServerDropdown: state.rooms.showServerDropdown,
	refreshing: state.rooms.refreshing,
	sortBy: state.sortPreferences.sortBy,
	groupByType: state.sortPreferences.groupByType,
	showFavorites: state.sortPreferences.showFavorites,
	showUnread: state.sortPreferences.showUnread,
	useRealName: state.settings.UI_Use_Real_Name,
	StoreLastMessage: state.settings.Store_Last_Message,
	subscribedRoom: state.room.subscribedRoom,
	queueSize: getInquiryQueueSelector(state).length,
	inquiryEnabled: state.inquiry.enabled,
	encryptionBanner: state.encryption.banner,
	showAvatar: state.sortPreferences.showAvatar,
	displayMode: state.sortPreferences.displayMode,
	createTeamPermission: state.permissions['create-team'],
	createDirectMessagePermission: state.permissions['create-d'],
	createPublicChannelPermission: state.permissions['create-c'],
	createPrivateChannelPermission: state.permissions['create-p'],
	createDiscussionPermission: state.permissions['start-discussion']
});

export default connect(mapStateToProps)(withDimensions(withTheme(withSafeAreaInsets(RoomsListView))));

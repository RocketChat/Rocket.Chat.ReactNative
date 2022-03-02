import React from 'react';
import { BackHandler, FlatList, Keyboard, NativeEventSubscription, RefreshControl, Text, View } from 'react-native';
import { batch, connect } from 'react-redux';
import { dequal } from 'dequal';
import Orientation from 'react-native-orientation-locker';
import { Q } from '@nozbe/watermelondb';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { Subscription } from 'rxjs';
import { StackNavigationOptions } from '@react-navigation/stack';

import database from '../../lib/database';
import RocketChat from '../../lib/rocketchat';
import RoomItem, { ROW_HEIGHT, ROW_HEIGHT_CONDENSED } from '../../presentation/RoomItem';
import log, { logEvent, events } from '../../utils/log';
import I18n from '../../i18n';
import { closeSearchHeader, closeServerDropdown, openSearchHeader, roomsRequest } from '../../actions/rooms';
import { appStart } from '../../actions/app';
import debounce from '../../utils/debounce';
import { isIOS, isTablet } from '../../utils/deviceInfo';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { serverInitAdd } from '../../actions/server';
import { animateNextTransition } from '../../utils/layoutAnimation';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import EventEmitter from '../../utils/events';
import {
	KEY_COMMAND,
	handleCommandAddNewServer,
	handleCommandNextRoom,
	handleCommandPreviousRoom,
	handleCommandSearching,
	handleCommandSelectRoom,
	handleCommandShowNewMessage,
	handleCommandShowPreferences,
	IKeyCommandEvent
} from '../../commands';
import { MAX_SIDEBAR_WIDTH } from '../../constants/tablet';
import { getUserSelector } from '../../selectors/login';
import { goRoom } from '../../utils/goRoom';
import SafeAreaView from '../../containers/SafeAreaView';
import Header, { getHeaderTitlePosition } from '../../containers/Header';
import { withDimensions } from '../../dimensions';
import { showConfirmationAlert, showErrorAlert } from '../../utils/info';
import { E2E_BANNER_TYPE } from '../../lib/encryption/constants';
import { getInquiryQueueSelector } from '../../ee/omnichannel/selectors/inquiry';
import { changeLivechatStatus, isOmnichannelStatusAvailable } from '../../ee/omnichannel/lib';
import { IApplicationState, IBaseScreen, ISubscription, IUser, RootEnum, TSubscriptionModel } from '../../definitions';
import { DisplayMode, SortBy } from '../../constants/constantDisplayMode';
import styles from './styles';
import ServerDropdown from './ServerDropdown';
import ListHeader, { TEncryptionBanner } from './ListHeader';
import RoomsListHeaderView from './Header';
import { ChatsStackParamList } from '../../stacks/types';
import { RoomTypes } from '../../lib/rocketchat/methods/roomTypeToApiType';

interface IRoomsListViewProps extends IBaseScreen<ChatsStackParamList, 'RoomsListView'> {
	[key: string]: any;
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
	rooms: ISubscription[];
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
	searching: boolean;
	search: ISubscription[];
	loading: boolean;
	chatsUpdate: [];
	chats: ISubscription[];
	item: ISubscription;
	canCreateRoom: boolean;
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
const OMNICHANNEL_HEADER = 'Open_Livechats';
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
	private mounted: boolean;
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
		this.mounted = false;
		this.count = 0;
		this.state = {
			searching: false,
			search: [],
			loading: true,
			chatsUpdate: [],
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
		this.mounted = true;

		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}
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
			this.search(nextProps.searchText);
		}
	}

	shouldComponentUpdate(nextProps: IRoomsListViewProps, nextState: IRoomsListViewState) {
		const { chatsUpdate, searching, item, canCreateRoom } = this.state;
		// eslint-disable-next-line react/destructuring-assignment
		const propsUpdated = shouldUpdateProps.some(key => nextProps[key] !== this.props[key]);
		if (propsUpdated) {
			return true;
		}

		// check if some display props are changed to force update when focus this view again
		// eslint-disable-next-line react/destructuring-assignment
		const displayUpdated = displayPropsShouldUpdate.some(key => nextProps[key] !== this.props[key]);
		if (displayUpdated) {
			this.shouldUpdate = true;
		}

		// check if some sort preferences are changed to getSubscription() when focus this view again
		// eslint-disable-next-line react/destructuring-assignment
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
		const { rooms, width, insets } = this.props;
		if (nextState.loading !== loading) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (!dequal(nextState.search, search)) {
			return true;
		}
		if (!dequal(nextProps.rooms, rooms)) {
			return true;
		}
		if (!dequal(nextProps.insets, insets)) {
			return true;
		}
		// If it's focused and there are changes, update
		if (chatsNotEqual) {
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
			rooms,
			isMasterDetail,
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
		// Update current item in case of another action triggers an update on rooms reducer
		if (isMasterDetail && item?.rid !== rooms[0].rid && !dequal(rooms, prevProps.rooms)) {
			// eslint-disable-next-line react/no-did-update-set-state
			// @ts-ignore
			this.setState({ item: { rid: rooms[0] } });
		}
		if (insets.left !== prevProps.insets.left || insets.right !== prevProps.insets.right) {
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
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
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
		const permissionsToCreate = await RocketChat.hasPermission(permissions);
		const canCreateRoom = permissionsToCreate.filter((r: boolean) => r === true).length > 0;
		this.setState({ canCreateRoom }, () => this.setHeader());
	};

	getHeader = () => {
		const { searching, canCreateRoom } = this.state;
		const { navigation, isMasterDetail, insets, theme } = this.props;
		const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: searching ? 0 : 3 });

		return {
			headerTitleAlign: 'left',
			headerLeft: () =>
				searching ? (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={this.cancelSearch} />
					</HeaderButton.Container>
				) : (
					<HeaderButton.Drawer
						navigation={navigation}
						testID='rooms-list-view-sidebar'
						onPress={
							isMasterDetail
								? () => navigation.navigate('ModalStackNavigator', { screen: 'SettingsView' })
								: // @ts-ignore
								  () => navigation.toggleDrawer()
						}
					/>
				),
			headerTitle: () => <RoomsListHeaderView theme={theme} />,
			headerTitleContainerStyle: {
				left: headerTitlePosition.left,
				right: headerTitlePosition.right
			},
			headerRight: () =>
				searching ? null : (
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
		const options = this.getHeader() as Partial<StackNavigationOptions>;
		navigation.setOptions(options);
	};

	// internalSetState = (...args: { chats: TSubscriptionModel; chatsUpdate: TSubscriptionModel; loading: boolean }[]) => {
	internalSetState = (...args: any) => {
		if (this.animated) {
			animateNextTransition();
		}
		// @ts-ignore
		this.setState(...args);
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
			defaultWhereClause.push(Q.experimentalSortBy(`${this.useRealName ? 'fname' : 'name'}`, Q.asc));
		} else {
			defaultWhereClause.push(Q.experimentalSortBy('room_updated_at', Q.desc));
		}

		// When we're grouping by something
		if (this.isGrouping) {
			observable = await db
				.get('subscriptions')
				.query(...defaultWhereClause)
				.observeWithColumns(['alert']);

			// When we're NOT grouping
		} else {
			this.count += QUERY_SIZE;
			observable = await db
				.get('subscriptions')
				.query(...defaultWhereClause, Q.experimentalSkip(0), Q.experimentalTake(this.count))
				.observe();
		}

		this.querySubscription = observable.subscribe(data => {
			let tempChats = [] as TSubscriptionModel[];
			let chats = data;

			let chatsUpdate = [];
			if (showUnread) {
				/**
				 * If unread on top, we trigger re-render based on order changes and sub.alert
				 * RoomItem handles its own re-render
				 */
				chatsUpdate = data.map(item => ({ rid: item.rid, alert: item.alert }));
			} else {
				/**
				 * Otherwise, we trigger re-render only when chats order changes
				 * RoomItem handles its own re-render
				 */
				chatsUpdate = data.map(item => item.rid);
			}

			const isOmnichannelAgent = user?.roles?.includes('livechat-agent');
			if (isOmnichannelAgent) {
				const omnichannel = chats.filter(s => filterIsOmnichannel(s));
				chats = chats.filter(s => !filterIsOmnichannel(s));
				tempChats = this.addRoomsGroup(omnichannel, OMNICHANNEL_HEADER, tempChats);
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

			if (this.mounted) {
				this.internalSetState({
					chats: tempChats,
					chatsUpdate,
					loading: false
				});
			} else {
				// @ts-ignore
				this.state.chats = tempChats;
				// @ts-ignore
				this.state.chatsUpdate = chatsUpdate;
				// @ts-ignore
				this.state.loading = false;
			}
		});
	};

	unsubscribeQuery = () => {
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	};

	initSearching = () => {
		logEvent(events.RL_SEARCH);
		const { dispatch } = this.props;
		this.internalSetState({ searching: true }, () => {
			dispatch(openSearchHeader());
			this.search('');
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
	search = debounce(async (text: string) => {
		const result = await RocketChat.search({ text });

		// if the search was cancelled before the promise is resolved
		const { searching } = this.state;
		if (!searching) {
			return;
		}
		this.internalSetState({
			search: result,
			searching: true
		});
		this.scrollToTop();
	}, 300);

	getRoomTitle = (item: ISubscription) => RocketChat.getRoomTitle(item);

	getRoomAvatar = (item: ISubscription) => RocketChat.getRoomAvatar(item);

	isGroupChat = (item: ISubscription) => RocketChat.isGroupChat(item);

	isRead = (item: ISubscription) => RocketChat.isRead(item);

	isSwipeEnabled = (item: IRoomItem) => !(item?.search || item?.joinCodeRequired || item?.outside);

	getUserPresence = (uid: string) => RocketChat.getUserPresence(uid);

	getUidDirectMessage = (room: ISubscription) => RocketChat.getUidDirectMessage(room);

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

	toggleFav = async (rid: string, favorite: boolean) => {
		logEvent(favorite ? events.RL_UNFAVORITE_CHANNEL : events.RL_FAVORITE_CHANNEL);
		try {
			const db = database.active;
			const result = await RocketChat.toggleFavorite(rid, !favorite);
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

	toggleRead = async (rid: string, isRead: boolean) => {
		logEvent(isRead ? events.RL_UNREAD_CHANNEL : events.RL_READ_CHANNEL);
		try {
			const db = database.active;
			const result = await RocketChat.toggleRead(isRead, rid);

			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update(sub => {
							sub.alert = isRead;
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

	hideChannel = async (rid: string, type: RoomTypes) => {
		logEvent(events.RL_HIDE_CHANNEL);
		try {
			const db = database.active;
			const result = await RocketChat.hideRoom(rid, type);
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
		const { navigation, isMasterDetail, queueSize, inquiryEnabled, user } = this.props;

		// if not-available, prompt to change to available
		if (!isOmnichannelStatusAvailable(user)) {
			showConfirmationAlert({
				message: I18n.t('Omnichannel_enable_alert'),
				confirmationText: I18n.t('Yes'),
				onPress: async () => {
					try {
						await changeLivechatStatus();
					} catch {
						// Do nothing
					}
				}
			});
		}

		if (!inquiryEnabled) {
			return;
		}
		// prevent navigation to empty list
		if (!queueSize) {
			return showErrorAlert(I18n.t('Queue_is_empty'), I18n.t('Oops'));
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
		const { rooms } = this.props;
		// @ts-ignore
		if (currentItem?.rid === item.rid || rooms?.includes(item.rid)) {
			return;
		}
		// Only mark room as focused when in master detail layout
		if (isMasterDetail) {
			this.setState({ item });
		}
		goRoom({ item, isMasterDetail });
	};

	goRoomByIndex = (index: number) => {
		const { chats } = this.state;
		const { isMasterDetail } = this.props;
		const filteredChats = chats.filter(c => !c.separator);
		const room = filteredChats[index - 1];
		if (room) {
			this.goRoom({ item: room, isMasterDetail });
		}
	};

	findOtherRoom = (index: number, sign: number): ISubscription | void => {
		const { chats } = this.state;
		const otherIndex = index + sign;
		const otherRoom = chats[otherIndex];
		if (!otherRoom) {
			return;
		}
		if (otherRoom.separator) {
			return this.findOtherRoom(otherIndex, sign);
		}
		return otherRoom;
	};

	// Go to previous or next room based on sign (-1 or 1)
	// It's used by iPad key commands
	goOtherRoom = (sign: number) => {
		const { item } = this.state;
		if (!item) {
			return;
		}

		// Don't run during search
		const { search } = this.state;
		if (search.length > 0) {
			return;
		}

		const { chats } = this.state;
		const { isMasterDetail } = this.props;
		const index = chats.findIndex(c => c.rid === item.rid);
		const otherRoom = this.findOtherRoom(index, sign);
		if (otherRoom) {
			this.goRoom({ item: otherRoom, isMasterDetail });
		}
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

	handleCommands = ({ event }: { event: IKeyCommandEvent }) => {
		const { navigation, server, isMasterDetail, dispatch } = this.props;
		const { input } = event;
		if (handleCommandShowPreferences(event)) {
			navigation.navigate('SettingsView');
		} else if (handleCommandSearching(event)) {
			this.initSearching();
		} else if (handleCommandSelectRoom(event)) {
			this.goRoomByIndex(input);
		} else if (handleCommandPreviousRoom(event)) {
			this.goOtherRoom(-1);
		} else if (handleCommandNextRoom(event)) {
			this.goOtherRoom(1);
		} else if (handleCommandShowNewMessage(event)) {
			if (isMasterDetail) {
				navigation.navigate('ModalStackNavigator', { screen: 'NewMessageView' });
			} else {
				navigation.navigate('NewMessageStack');
			}
		} else if (handleCommandAddNewServer(event)) {
			batch(() => {
				dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
				dispatch(serverInitAdd(server));
			});
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
		const { queueSize, inquiryEnabled, encryptionBanner, user, theme } = this.props;
		return (
			<ListHeader
				searching={searching}
				goEncryption={this.goEncryption}
				goQueue={this.goQueue}
				queueSize={queueSize}
				inquiryEnabled={inquiryEnabled}
				encryptionBanner={encryptionBanner}
				user={user}
				theme={theme}
			/>
		);
	};

	renderHeader = () => {
		const { isMasterDetail } = this.props;

		if (!isMasterDetail) {
			return null;
		}

		const options = this.getHeader() as any;
		return <Header {...options} />;
	};

	renderItem = ({ item }: { item: ISubscription }) => {
		if (item.separator) {
			return this.renderSectionHeader(item.rid);
		}

		const { item: currentItem } = this.state;
		const {
			user: { username },
			StoreLastMessage,
			useRealName,
			theme,
			isMasterDetail,
			width,
			showAvatar,
			displayMode
		} = this.props;
		const id = this.getUidDirectMessage(item);
		const swipeEnabled = this.isSwipeEnabled(item);

		return (
			<RoomItem
				item={item}
				theme={theme}
				id={id}
				type={item.t}
				username={username}
				showLastMessage={StoreLastMessage}
				onPress={this.onPressItem}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				toggleFav={this.toggleFav}
				toggleRead={this.toggleRead}
				hideChannel={this.hideChannel}
				useRealName={useRealName}
				getUserPresence={this.getUserPresence}
				getRoomTitle={this.getRoomTitle}
				getRoomAvatar={this.getRoomAvatar}
				getIsGroupChat={this.isGroupChat}
				getIsRead={this.isRead}
				visitor={item.visitor}
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
			return <ActivityIndicator theme={theme} />;
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
	rooms: state.room.rooms,
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

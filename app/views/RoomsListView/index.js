import React from 'react';
import PropTypes from 'prop-types';
import {
	View,
	FlatList,
	BackHandler,
	Text,
	Keyboard,
	RefreshControl
} from 'react-native';
import { connect } from 'react-redux';
import isEqual from 'react-fast-compare';
import Orientation from 'react-native-orientation-locker';
import { Q } from '@nozbe/watermelondb';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import database from '../../lib/database';
import RocketChat from '../../lib/rocketchat';
import RoomItem, { ROW_HEIGHT } from '../../presentation/RoomItem';
import styles from './styles';
import log from '../../utils/log';
import I18n from '../../i18n';
import SortDropdown from './SortDropdown';
import ServerDropdown from './ServerDropdown';
import {
	toggleSortDropdown as toggleSortDropdownAction,
	openSearchHeader as openSearchHeaderAction,
	closeSearchHeader as closeSearchHeaderAction,
	roomsRequest as roomsRequestAction,
	closeServerDropdown as closeServerDropdownAction
} from '../../actions/rooms';
import { appStart as appStartAction, ROOT_BACKGROUND } from '../../actions/app';
import debounce from '../../utils/debounce';
import { isIOS, isTablet } from '../../utils/deviceInfo';
import RoomsListHeaderView from './Header';
import {
	DrawerButton,
	CustomHeaderButtons,
	Item
} from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import ListHeader from './ListHeader';
import { selectServerRequest as selectServerRequestAction } from '../../actions/server';
import { animateNextTransition } from '../../utils/layoutAnimation';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import EventEmitter from '../../utils/events';
import {
	KEY_COMMAND,
	handleCommandShowPreferences,
	handleCommandSearching,
	handleCommandSelectRoom,
	handleCommandPreviousRoom,
	handleCommandNextRoom,
	handleCommandShowNewMessage,
	handleCommandAddNewServer
} from '../../commands';
import { MAX_SIDEBAR_WIDTH } from '../../constants/tablet';
import { getUserSelector } from '../../selectors/login';
import { goRoom } from '../../utils/goRoom';
import SafeAreaView from '../../containers/SafeAreaView';
import Header, { getHeaderTitlePosition } from '../../containers/Header';
import { withDimensions } from '../../dimensions';

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;
const CHATS_HEADER = 'Chats';
const UNREAD_HEADER = 'Unread';
const FAVORITES_HEADER = 'Favorites';
const DISCUSSIONS_HEADER = 'Discussions';
const CHANNELS_HEADER = 'Channels';
const DM_HEADER = 'Direct_Messages';
const GROUPS_HEADER = 'Private_Groups';
const QUERY_SIZE = 20;

const filterIsUnread = s => (s.unread > 0 || s.alert) && !s.hideUnreadStatus;
const filterIsFavorite = s => s.f;

const shouldUpdateProps = [
	'searchText',
	'loadingServer',
	'showServerDropdown',
	'showSortDropdown',
	'sortBy',
	'groupByType',
	'showFavorites',
	'showUnread',
	'useRealName',
	'StoreLastMessage',
	'appState',
	'theme',
	'isMasterDetail',
	'refreshing'
];
const getItemLayout = (data, index) => ({
	length: ROW_HEIGHT,
	offset: ROW_HEIGHT * index,
	index
});
const keyExtractor = item => item.rid;

class RoomsListView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		server: PropTypes.string,
		searchText: PropTypes.string,
		loadingServer: PropTypes.bool,
		showServerDropdown: PropTypes.bool,
		showSortDropdown: PropTypes.bool,
		sortBy: PropTypes.string,
		groupByType: PropTypes.bool,
		showFavorites: PropTypes.bool,
		showUnread: PropTypes.bool,
		refreshing: PropTypes.bool,
		StoreLastMessage: PropTypes.bool,
		appState: PropTypes.string,
		theme: PropTypes.string,
		toggleSortDropdown: PropTypes.func,
		openSearchHeader: PropTypes.func,
		closeSearchHeader: PropTypes.func,
		appStart: PropTypes.func,
		roomsRequest: PropTypes.func,
		closeServerDropdown: PropTypes.func,
		useRealName: PropTypes.bool,
		connected: PropTypes.bool,
		isMasterDetail: PropTypes.bool,
		rooms: PropTypes.array,
		width: PropTypes.number,
		insets: PropTypes.object
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);

		this.gotSubscriptions = false;
		this.animated = false;
		this.count = 0;
		this.state = {
			searching: false,
			search: [],
			loading: true,
			chatsOrder: [],
			chats: [],
			item: {}
		};
		this.setHeader();
	}

	componentDidMount() {
		const {
			navigation, closeServerDropdown, appState
		} = this.props;

		/**
		 * - When didMount is triggered and appState is foreground,
		 * it means the user is logging in and selectServer has ran, so we can getSubscriptions
		 *
		 * - When didMount is triggered and appState is background,
		 * it means the user has resumed the app, so selectServer needs to be triggered,
		 * which is going to change server and getSubscriptions will be triggered by componentWillReceiveProps
		 */
		if (appState === 'foreground') {
			this.getSubscriptions();
		}

		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}
		this.unsubscribeFocus = navigation.addListener('focus', () => {
			Orientation.unlockAllOrientations();
			this.animated = true;
			// Check if there were changes while not focused (it's set on sCU)
			if (this.shouldUpdate) {
				this.forceUpdate();
				this.shouldUpdate = false;
			}
			this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
		});
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			this.animated = false;
			closeServerDropdown();
			this.cancelSearch();
			if (this.backHandler && this.backHandler.remove) {
				this.backHandler.remove();
			}
		});
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		const { loadingServer, searchText, server } = this.props;

		if (nextProps.server && loadingServer !== nextProps.loadingServer) {
			if (nextProps.loadingServer) {
				this.setState({ loading: true });
			} else {
				this.getSubscriptions();
			}
		}
		if (server && server !== nextProps.server) {
			this.gotSubscriptions = false;
		}
		if (searchText !== nextProps.searchText) {
			this.search(nextProps.searchText);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { chatsOrder, searching, item } = this.state;
		// eslint-disable-next-line react/destructuring-assignment
		const propsUpdated = shouldUpdateProps.some(key => nextProps[key] !== this.props[key]);
		if (propsUpdated) {
			return true;
		}

		// Compare changes only once
		const chatsNotEqual = !isEqual(nextState.chatsOrder, chatsOrder);

		// If they aren't equal, set to update if focused
		if (chatsNotEqual) {
			this.shouldUpdate = true;
		}

		if (nextState.searching !== searching) {
			return true;
		}

		if (nextState.item?.rid !== item?.rid) {
			return true;
		}

		// Abort if it's not focused
		if (!nextProps.navigation.isFocused()) {
			return false;
		}

		const {
			loading,
			search
		} = this.state;
		const { rooms, width, insets } = this.props;
		if (nextState.loading !== loading) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (!isEqual(nextState.search, search)) {
			return true;
		}
		if (!isEqual(nextProps.rooms, rooms)) {
			return true;
		}
		if (!isEqual(nextProps.insets, insets)) {
			return true;
		}
		// If it's focused and there are changes, update
		if (chatsNotEqual) {
			this.shouldUpdate = false;
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		const {
			sortBy,
			groupByType,
			showFavorites,
			showUnread,
			appState,
			connected,
			roomsRequest,
			rooms,
			isMasterDetail,
			insets
		} = this.props;
		const { item } = this.state;

		if (
			!(
				prevProps.sortBy === sortBy
				&& prevProps.groupByType === groupByType
				&& prevProps.showFavorites === showFavorites
				&& prevProps.showUnread === showUnread
			)
		) {
			this.getSubscriptions();
		} else if (
			appState === 'foreground'
			&& appState !== prevProps.appState
			&& connected
		) {
			roomsRequest();
		}
		// Update current item in case of another action triggers an update on rooms reducer
		if (isMasterDetail && item?.rid !== rooms[0] && !isEqual(rooms, prevProps.rooms)) {
			// eslint-disable-next-line react/no-did-update-set-state
			this.setState({ item: { rid: rooms[0] } });
		}
		if (insets.left !== prevProps.insets.left || insets.right !== prevProps.insets.right) {
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
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	getHeader = () => {
		const { searching } = this.state;
		const { navigation, isMasterDetail, insets } = this.props;
		const headerTitlePosition = getHeaderTitlePosition(insets);
		return {
			headerTitleAlign: 'left',
			headerLeft: () => (searching ? (
				<CustomHeaderButtons left>
					<Item
						title='cancel'
						iconName='Cross'
						onPress={this.cancelSearch}
					/>
				</CustomHeaderButtons>
			) : (
				<DrawerButton
					navigation={navigation}
					testID='rooms-list-view-sidebar'
					onPress={isMasterDetail
						? () => navigation.navigate('ModalStackNavigator', { screen: 'SettingsView' })
						: () => navigation.toggleDrawer()}
				/>
			)),
			headerTitle: () => <RoomsListHeaderView />,
			headerTitleContainerStyle: {
				left: headerTitlePosition.left,
				right: headerTitlePosition.right
			},
			headerRight: () => (searching ? null : (
				<CustomHeaderButtons>
					<Item
						title='new'
						iconName='new-chat'
						onPress={isMasterDetail
							? () => navigation.navigate('ModalStackNavigator', { screen: 'NewMessageView' })
							: () => navigation.navigate('NewMessageStackNavigator')}
						testID='rooms-list-view-create-channel'
					/>
					<Item
						title='search'
						iconName='magnifier'
						onPress={this.initSearching}
						testID='rooms-list-view-search'
					/>
				</CustomHeaderButtons>
			))
		};
	}

	setHeader = () => {
		const { navigation } = this.props;
		const options = this.getHeader();
		navigation.setOptions(options);
	}

	internalSetState = (...args) => {
		if (this.animated) {
			animateNextTransition();
		}
		this.setState(...args);
	};

	addRoomsGroup = (data, header, allData) => {
		if (data.length > 0) {
			if (header) {
				allData.push({ rid: header, separator: true });
			}
			allData = allData.concat(data);
		}
		return allData;
	}

	getSubscriptions = async() => {
		this.unsubscribeQuery();

		const {
			sortBy,
			showUnread,
			showFavorites,
			groupByType
		} = this.props;

		const db = database.active;
		let observable;

		const defaultWhereClause = [
			Q.where('archived', false),
			Q.where('open', true)
		];

		if (sortBy === 'alphabetical') {
			defaultWhereClause.push(Q.experimentalSortBy(`${ this.useRealName ? 'fname' : 'name' }`, Q.asc));
		} else {
			defaultWhereClause.push(Q.experimentalSortBy('room_updated_at', Q.desc));
		}

		// When we're grouping by something
		if (this.isGrouping) {
			observable = await db.collections
				.get('subscriptions')
				.query(...defaultWhereClause)
				.observe();

		// When we're NOT grouping
		} else {
			this.count += QUERY_SIZE;
			observable = await db.collections
				.get('subscriptions')
				.query(
					...defaultWhereClause,
					Q.experimentalSkip(0),
					Q.experimentalTake(this.count)
				)
				.observe();
		}


		this.querySubscription = observable.subscribe((data) => {
			let tempChats = [];
			let chats = data;

			/**
			 * We trigger re-render only when chats order changes
			 * RoomItem handles its own re-render
			 */
			const chatsOrder = data.map(item => item.rid);

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
				const discussions = chats.filter(s => s.prid);
				const channels = chats.filter(s => s.t === 'c' && !s.prid);
				const privateGroup = chats.filter(s => s.t === 'p' && !s.prid);
				const direct = chats.filter(s => s.t === 'd' && !s.prid);
				tempChats = this.addRoomsGroup(discussions, DISCUSSIONS_HEADER, tempChats);
				tempChats = this.addRoomsGroup(channels, CHANNELS_HEADER, tempChats);
				tempChats = this.addRoomsGroup(privateGroup, GROUPS_HEADER, tempChats);
				tempChats = this.addRoomsGroup(direct, DM_HEADER, tempChats);
			} else if (showUnread || showFavorites) {
				tempChats = this.addRoomsGroup(chats, CHATS_HEADER, tempChats);
			} else {
				tempChats = chats;
			}

			this.internalSetState({
				chats: tempChats,
				chatsOrder,
				loading: false
			});
		});
	}

	unsubscribeQuery = () => {
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	}

	initSearching = () => {
		const { openSearchHeader } = this.props;
		this.internalSetState({ searching: true }, () => {
			openSearchHeader();
			this.setHeader();
		});
	};

	cancelSearch = () => {
		const { searching } = this.state;
		const { closeSearchHeader } = this.props;

		if (!searching) {
			return;
		}

		Keyboard.dismiss();

		this.setState({ searching: false, search: [] }, () => {
			this.setHeader();
			closeSearchHeader();
			setTimeout(() => {
				this.scrollToTop();
			}, 200);
		});
	};

	handleBackPress = () => {
		const { searching } = this.state;
		const { appStart } = this.props;
		if (searching) {
			this.cancelSearch();
			return true;
		}
		appStart({ root: ROOT_BACKGROUND });
		return false;
	};

	// eslint-disable-next-line react/sort-comp
	search = debounce(async(text) => {
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

	getRoomTitle = item => RocketChat.getRoomTitle(item)

	getRoomAvatar = item => RocketChat.getRoomAvatar(item)

	isGroupChat = item => RocketChat.isGroupChat(item)

	isRead = item => RocketChat.isRead(item)

	getUserPresence = uid => RocketChat.getUserPresence(uid)

	getUidDirectMessage = room => RocketChat.getUidDirectMessage(room);

	get isGrouping() {
		const { showUnread, showFavorites, groupByType } = this.props;
		return showUnread || showFavorites || groupByType;
	}

	onPressItem = (item = {}) => {
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
	}

	toggleSort = () => {
		const { toggleSortDropdown } = this.props;

		this.scrollToTop();
		setTimeout(() => {
			toggleSortDropdown();
		}, 100);
	};

	toggleFav = async(rid, favorite) => {
		try {
			const db = database.active;
			const result = await RocketChat.toggleFavorite(rid, !favorite);
			if (result.success) {
				const subCollection = db.collections.get('subscriptions');
				await db.action(async() => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update((sub) => {
							sub.f = !favorite;
						});
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			log(e);
		}
	};

	toggleRead = async(rid, isRead) => {
		try {
			const db = database.active;
			const result = await RocketChat.toggleRead(isRead, rid);
			if (result.success) {
				const subCollection = db.collections.get('subscriptions');
				await db.action(async() => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update((sub) => {
							sub.alert = isRead;
						});
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			log(e);
		}
	};

	hideChannel = async(rid, type) => {
		try {
			const db = database.active;
			const result = await RocketChat.hideRoom(rid, type);
			if (result.success) {
				const subCollection = db.collections.get('subscriptions');
				await db.action(async() => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.destroyPermanently();
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			log(e);
		}
	};

	goDirectory = () => {
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'DirectoryView' });
		} else {
			navigation.navigate('DirectoryView');
		}
	};

	goRoom = ({ item, isMasterDetail }) => {
		const { item: currentItem } = this.state;
		const { rooms } = this.props;
		if (currentItem?.rid === item.rid || rooms?.includes(item.rid)) {
			return;
		}
		// Only mark room as focused when in master detail layout
		if (isMasterDetail) {
			this.setState({ item });
		}
		goRoom({ item, isMasterDetail });
	}

	goRoomByIndex = (index) => {
		const { chats } = this.state;
		const { isMasterDetail } = this.props;
		const filteredChats = chats.filter(c => !c.separator);
		const room = filteredChats[index - 1];
		if (room) {
			this.goRoom({ item: room, isMasterDetail });
		}
	}

	findOtherRoom = (index, sign) => {
		const { chats } = this.state;
		const otherIndex = index + sign;
		const otherRoom = chats[otherIndex];
		if (!otherRoom) {
			return;
		}
		if (otherRoom.separator) {
			return this.findOtherRoom(otherIndex, sign);
		} else {
			return otherRoom;
		}
	}

	// Go to previous or next room based on sign (-1 or 1)
	// It's used by iPad key commands
	goOtherRoom = (sign) => {
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
	}

	handleCommands = ({ event }) => {
		const { navigation, server, isMasterDetail } = this.props;
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
			navigation.navigate('NewServerView', { previousServer: server });
		}
	};

	onRefresh = () => {
		const { searching } = this.state;
		const { roomsRequest } = this.props;
		if (searching) {
			return;
		}
		roomsRequest({ allData: true });
	}

	onEndReached = () => {
		// Run only when we're not grouping by anything
		if (!this.isGrouping) {
			this.getSubscriptions();
		}
	}

	getScrollRef = ref => (this.scroll = ref);

	renderListHeader = () => {
		const { searching } = this.state;
		const { sortBy } = this.props;
		return (
			<ListHeader
				searching={searching}
				sortBy={sortBy}
				toggleSort={this.toggleSort}
				goDirectory={this.goDirectory}
			/>
		);
	};

	renderHeader = () => {
		const { isMasterDetail, theme } = this.props;

		if (!isMasterDetail) {
			return null;
		}

		const options = this.getHeader();
		return (
			<Header
				theme={theme}
				{...options}
			/>
		);
	}

	renderItem = ({ item }) => {
		if (item.separator) {
			return this.renderSectionHeader(item.rid);
		}

		const { item: currentItem } = this.state;
		const {
			user: {
				id: userId,
				username,
				token
			},
			server,
			StoreLastMessage,
			useRealName,
			theme,
			isMasterDetail,
			width
		} = this.props;
		const id = this.getUidDirectMessage(item);

		return (
			<RoomItem
				item={item}
				theme={theme}
				id={id}
				type={item.t}
				userId={userId}
				username={username}
				token={token}
				baseUrl={server}
				showLastMessage={StoreLastMessage}
				onPress={this.onPressItem}
				testID={`rooms-list-view-item-${ item.name }`}
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
			/>
		);
	};

	renderSectionHeader = (header) => {
		const { theme } = this.props;
		return (
			<View style={[styles.groupTitleContainer, { backgroundColor: themes[theme].backgroundColor }]}>
				<Text style={[styles.groupTitle, { color: themes[theme].controlText }]}>{I18n.t(header)}</Text>
			</View>
		);
	}

	renderScroll = () => {
		const {
			loading, chats, search, searching
		} = this.state;
		const { theme, refreshing } = this.props;

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
				getItemLayout={getItemLayout}
				removeClippedSubviews={isIOS}
				keyboardShouldPersistTaps='always'
				initialNumToRender={INITIAL_NUM_TO_RENDER}
				refreshControl={(
					<RefreshControl
						refreshing={refreshing}
						onRefresh={this.onRefresh}
						tintColor={themes[theme].auxiliaryText}
					/>
				)}
				windowSize={9}
				onEndReached={this.onEndReached}
				onEndReachedThreshold={0.5}
			/>
		);
	};

	render = () => {
		console.count(`${ this.constructor.name }.render calls`);
		const {
			sortBy,
			groupByType,
			showFavorites,
			showUnread,
			showServerDropdown,
			showSortDropdown,
			theme,
			navigation
		} = this.props;

		return (
			<SafeAreaView testID='rooms-list-view' theme={theme} style={{ backgroundColor: themes[theme].backgroundColor }}>
				<StatusBar theme={theme} />
				{this.renderHeader()}
				{this.renderScroll()}
				{showSortDropdown ? (
					<SortDropdown
						close={this.toggleSort}
						sortBy={sortBy}
						groupByType={groupByType}
						showFavorites={showFavorites}
						showUnread={showUnread}
					/>
				) : null}
				{showServerDropdown ? <ServerDropdown navigation={navigation} /> : null}
			</SafeAreaView>
		);
	};
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	server: state.server.server,
	connected: state.server.connected,
	searchText: state.rooms.searchText,
	loadingServer: state.server.loading,
	showServerDropdown: state.rooms.showServerDropdown,
	showSortDropdown: state.rooms.showSortDropdown,
	refreshing: state.rooms.refreshing,
	sortBy: state.sortPreferences.sortBy,
	groupByType: state.sortPreferences.groupByType,
	showFavorites: state.sortPreferences.showFavorites,
	showUnread: state.sortPreferences.showUnread,
	useRealName: state.settings.UI_Use_Real_Name,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background',
	StoreLastMessage: state.settings.Store_Last_Message,
	rooms: state.room.rooms
});

const mapDispatchToProps = dispatch => ({
	toggleSortDropdown: () => dispatch(toggleSortDropdownAction()),
	openSearchHeader: () => dispatch(openSearchHeaderAction()),
	closeSearchHeader: () => dispatch(closeSearchHeaderAction()),
	appStart: params => dispatch(appStartAction(params)),
	roomsRequest: params => dispatch(roomsRequestAction(params)),
	selectServerRequest: server => dispatch(selectServerRequestAction(server)),
	closeServerDropdown: () => dispatch(closeServerDropdownAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(withDimensions(withTheme(withSafeAreaInsets(RoomsListView))));

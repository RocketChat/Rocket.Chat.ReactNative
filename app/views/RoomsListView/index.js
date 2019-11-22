import React from 'react';
import PropTypes from 'prop-types';
import {
	View,
	FlatList,
	BackHandler,
	ActivityIndicator,
	Text,
	ScrollView,
	Keyboard,
	Dimensions
} from 'react-native';
import { connect } from 'react-redux';
import { isEqual, orderBy } from 'lodash';
import { SafeAreaView } from 'react-navigation';
import Orientation from 'react-native-orientation-locker';
import { Q } from '@nozbe/watermelondb';

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
import { appStart as appStartAction } from '../../actions';
import debounce from '../../utils/debounce';
import { isIOS, isAndroid, isTablet } from '../../utils/deviceInfo';
import RoomsListHeaderView from './Header';
import {
	DrawerButton,
	CustomHeaderButtons,
	Item
} from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ListHeader from './ListHeader';
import { selectServerRequest as selectServerRequestAction } from '../../actions/server';
import { animateNextTransition } from '../../utils/layoutAnimation';
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
import { withSplit } from '../../split';

const SCROLL_OFFSET = 56;
const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;
const CHATS_HEADER = 'Chats';
const UNREAD_HEADER = 'Unread';
const FAVORITES_HEADER = 'Favorites';
const DISCUSSIONS_HEADER = 'Discussions';
const CHANNELS_HEADER = 'Channels';
const DM_HEADER = 'Direct_Messages';
const GROUPS_HEADER = 'Private_Groups';

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
	'split'
];
const getItemLayout = (data, index) => ({
	length: ROW_HEIGHT,
	offset: ROW_HEIGHT * index,
	index
});
const keyExtractor = item => item.rid;

class RoomsListView extends React.Component {
	static navigationOptions = ({ navigation }) => {
		const searching = navigation.getParam('searching');
		const cancelSearchingAndroid = navigation.getParam(
			'cancelSearchingAndroid'
		);
		const onPressItem = navigation.getParam('onPressItem', () => {});
		const initSearchingAndroid = navigation.getParam(
			'initSearchingAndroid',
			() => {}
		);

		return {
			headerLeft: searching ? (
				<CustomHeaderButtons left>
					<Item
						title='cancel'
						iconName='cross'
						onPress={cancelSearchingAndroid}
					/>
				</CustomHeaderButtons>
			) : (
				<DrawerButton
					navigation={navigation}
					testID='rooms-list-view-sidebar'
				/>
			),
			headerTitle: <RoomsListHeaderView />,
			headerRight: searching ? null : (
				<CustomHeaderButtons>
					{isAndroid ? (
						<Item
							title='search'
							iconName='magnifier'
							onPress={initSearchingAndroid}
						/>
					) : null}
					<Item
						title='new'
						iconName='edit-rounded'
						onPress={() => navigation.navigate('NewMessageView', {
							onPressItem
						})}
						testID='rooms-list-view-create-channel'
					/>
				</CustomHeaderButtons>
			)
		};
	};

	static propTypes = {
		navigation: PropTypes.object,
		userId: PropTypes.string,
		username: PropTypes.string,
		token: PropTypes.string,
		baseUrl: PropTypes.string,
		server: PropTypes.string,
		searchText: PropTypes.string,
		loadingServer: PropTypes.bool,
		showServerDropdown: PropTypes.bool,
		showSortDropdown: PropTypes.bool,
		sortBy: PropTypes.string,
		groupByType: PropTypes.bool,
		showFavorites: PropTypes.bool,
		showUnread: PropTypes.bool,
		useRealName: PropTypes.bool,
		StoreLastMessage: PropTypes.bool,
		appState: PropTypes.string,
		toggleSortDropdown: PropTypes.func,
		openSearchHeader: PropTypes.func,
		closeSearchHeader: PropTypes.func,
		appStart: PropTypes.func,
		roomsRequest: PropTypes.func,
		closeServerDropdown: PropTypes.func,
		split: PropTypes.bool
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);

		const { width } = Dimensions.get('window');
		this.state = {
			searching: false,
			search: [],
			loading: true,
			allChats: [],
			chats: [],
			unread: [],
			favorites: [],
			discussions: [],
			channels: [],
			privateGroup: [],
			direct: [],
			width
		};
		Orientation.unlockAllOrientations();
		this.willFocusListener = props.navigation.addListener('willFocus', () => {
			// Check if there were changes while not focused (it's set on sCU)
			if (this.shouldUpdate) {
				// animateNextTransition();
				this.forceUpdate();
				this.shouldUpdate = false;
			}
		});
		this.didFocusListener = props.navigation.addListener('didFocus', () => {
			BackHandler.addEventListener(
				'hardwareBackPress',
				this.handleBackPress
			);
		});
		this.willBlurListener = props.navigation.addListener('willBlur', () => {
			props.closeServerDropdown();
			BackHandler.addEventListener(
				'hardwareBackPress',
				this.handleBackPress
			);
		});
	}

	componentDidMount() {
		this.getSubscriptions();
		const { navigation } = this.props;
		navigation.setParams({
			onPressItem: this._onPressItem,
			initSearchingAndroid: this.initSearchingAndroid,
			cancelSearchingAndroid: this.cancelSearchingAndroid
		});
		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}
		Dimensions.addEventListener('change', this.onDimensionsChange);
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	componentWillReceiveProps(nextProps) {
		const { loadingServer, searchText } = this.props;

		if (nextProps.server && loadingServer !== nextProps.loadingServer) {
			if (nextProps.loadingServer) {
				this.internalSetState({ loading: true });
			} else {
				this.getSubscriptions();
			}
		} else if (searchText !== nextProps.searchText) {
			this.search(nextProps.searchText);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { allChats } = this.state;
		// eslint-disable-next-line react/destructuring-assignment
		const propsUpdated = shouldUpdateProps.some(key => nextProps[key] !== this.props[key]);
		if (propsUpdated) {
			return true;
		}

		// Compare changes only once
		const chatsNotEqual = !isEqual(nextState.allChats, allChats);

		// If they aren't equal, set to update if focused
		if (chatsNotEqual) {
			this.shouldUpdate = true;
		}

		// Abort if it's not focused
		if (!nextProps.navigation.isFocused()) {
			return false;
		}

		const {
			loading,
			searching,
			width,
			search
		} = this.state;
		if (nextState.loading !== loading) {
			return true;
		}
		if (nextState.searching !== searching) {
			return true;
		}
		if (nextState.width !== width) {
			return true;
		}
		if (!isEqual(nextState.search, search)) {
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
			roomsRequest
		} = this.props;

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
		) {
			roomsRequest();
		}
	}

	componentWillUnmount() {
		if (this.getSubscriptions && this.getSubscriptions.stop) {
			this.getSubscriptions.stop();
		}
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
		if (this.willFocusListener && this.willFocusListener.remove) {
			this.willFocusListener.remove();
		}
		if (this.didFocusListener && this.didFocusListener.remove) {
			this.didFocusListener.remove();
		}
		if (this.willBlurListener && this.willBlurListener.remove) {
			this.willBlurListener.remove();
		}
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
		Dimensions.removeEventListener('change', this.onDimensionsChange);
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	onDimensionsChange = ({ window: { width } }) => this.setState({ width });

	// eslint-disable-next-line react/sort-comp
	internalSetState = (...args) => {
		const { navigation } = this.props;
		if (navigation.isFocused()) {
			animateNextTransition();
		}
		this.setState(...args);
	};

	getSubscriptions = debounce(async() => {
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}

		const {
			sortBy,
			showUnread,
			showFavorites,
			groupByType
		} = this.props;

		const db = database.active;
		const observable = await db.collections
			.get('subscriptions')
			.query(
				Q.where('archived', false),
				Q.where('open', true),
				Q.where('t', Q.notEq('l'))
			)
			.observeWithColumns(['room_updated_at', 'unread', 'alert', 'user_mentions', 'f', 't']);

		this.querySubscription = observable.subscribe((data) => {
			let chats = [];
			let unread = [];
			let favorites = [];
			let discussions = [];
			let channels = [];
			let privateGroup = [];
			let direct = [];
			if (sortBy === 'alphabetical') {
				chats = orderBy(data, ['name'], ['asc']);
			} else {
				chats = orderBy(data, ['roomUpdatedAt'], ['desc']);
			}

			// it's better to map and test all subs altogether then testing them individually
			const allChats = data.map(item => ({
				alert: item.alert,
				unread: item.unread,
				userMentions: item.userMentions,
				isRead: this.getIsRead(item),
				favorite: item.f,
				lastMessage: item.lastMessage,
				name: this.getRoomTitle(item),
				_updatedAt: item.roomUpdatedAt,
				key: item._id,
				rid: item.rid,
				type: item.t,
				prid: item.prid
			}));

			// unread
			if (showUnread) {
				unread = chats.filter(s => (s.unread > 0 || s.alert) && !s.hideUnreadStatus);
			} else {
				unread = [];
			}

			// favorites
			if (showFavorites) {
				favorites = chats.filter(s => s.f);
			} else {
				favorites = [];
			}

			// type
			if (groupByType) {
				discussions = chats.filter(s => s.prid);
				channels = chats.filter(s => s.t === 'c' && !s.prid);
				privateGroup = chats.filter(s => s.t === 'p' && !s.prid);
				direct = chats.filter(s => s.t === 'd' && !s.prid);
			} else if (showUnread) {
				chats = chats.filter(s => (!s.unread && !s.alert) || s.hideUnreadStatus);
			}

			this.internalSetState({
				allChats,
				chats,
				unread,
				favorites,
				discussions,
				channels,
				privateGroup,
				direct,
				loading: false
			});
		});
	}, 300, true);

	initSearchingAndroid = () => {
		const { openSearchHeader, navigation } = this.props;
		this.setState({ searching: true });
		navigation.setParams({ searching: true });
		openSearchHeader();
	};

	cancelSearchingAndroid = () => {
		if (isAndroid) {
			const { closeSearchHeader, navigation } = this.props;
			this.setState({ searching: false });
			navigation.setParams({ searching: false });
			closeSearchHeader();
			this.internalSetState({ search: [] });
		}
		Keyboard.dismiss();
	};

	handleBackPress = () => {
		const { searching } = this.state;
		const { appStart } = this.props;
		if (searching) {
			this.cancelSearchingAndroid();
			return true;
		}
		appStart('background');
		return false;
	};

	// eslint-disable-next-line react/sort-comp
	search = debounce(async(text) => {
		const result = await RocketChat.search({ text });
		this.internalSetState({
			search: result
		});
	}, 300);

	getRoomTitle = (item) => {
		const { useRealName } = this.props;
		return ((item.prid || useRealName) && item.fname) || item.name;
	};

	goRoom = (item, header) => {
		this.cancelSearchingAndroid();
		const { navigation } = this.props;
		this.item = item;
		this.header = header;
		navigation.navigate('RoomView', {
			rid: item.rid,
			name: this.getRoomTitle(item),
			t: item.t,
			prid: item.prid,
			room: item
		});
	};

	_onPressItem = async(item = {}, header) => {
		if (!item.search) {
			return this.goRoom(item, header);
		}
		if (item.t === 'd') {
			// if user is using the search we need first to join/create room
			try {
				const { username } = item;
				const result = await RocketChat.createDirectMessage(username);
				if (result.success) {
					return this.goRoom({
						rid: result.room._id,
						name: username,
						t: 'd'
					}, header);
				}
			} catch (e) {
				log(e);
			}
		} else {
			return this.goRoom(item, header);
		}
	};

	toggleSort = () => {
		const { toggleSortDropdown } = this.props;

		const offset = isAndroid ? 0 : SCROLL_OFFSET;
		if (this.scroll.scrollTo) {
			this.scroll.scrollTo({ x: 0, y: offset, animated: true });
		} else if (this.scroll.scrollToOffset) {
			this.scroll.scrollToOffset({ offset });
		}
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
		const { navigation } = this.props;
		navigation.navigate('DirectoryView');
	};

	// Get rooms group state by header
	getRoomsGroupState = (header) => {
		const {
			chats, favorites, unread, discussions, channels, direct, privateGroup
		} = this.state;
		let rooms = [];
		switch (header) {
			case CHATS_HEADER:
				rooms = chats;
				break;
			case FAVORITES_HEADER:
				rooms = favorites;
				break;
			case UNREAD_HEADER:
				rooms = unread;
				break;
			case DISCUSSIONS_HEADER:
				rooms = discussions;
				break;
			case CHANNELS_HEADER:
				rooms = channels;
				break;
			case DM_HEADER:
				rooms = direct;
				break;
			case GROUPS_HEADER:
				rooms = privateGroup;
				break;
			default:
				break;
		}
		return rooms;
	}

	getRoomsGroupOrder = () => {
		const { showUnread, showFavorites, groupByType } = this.props;
		const order = [];
		if (showUnread) {
			order.push(UNREAD_HEADER);
		}
		if (showFavorites) {
			order.push(FAVORITES_HEADER);
		}
		if (groupByType) {
			order.push(DISCUSSIONS_HEADER);
			order.push(CHANNELS_HEADER);
			order.push(DM_HEADER);
			order.push(GROUPS_HEADER);
		} else {
			order.push(CHATS_HEADER);
		}
		return order;
	}

	getOtherRoomsGroupState = (header, sign) => {
		const order = this.getRoomsGroupOrder();
		const index = order.indexOf(header);
		const otherGroupHeader = order[index + sign];
		// if it's the last rooms group
		if (!otherGroupHeader) {
			return {};
		}
		const otherGroupState = this.getRoomsGroupState(otherGroupHeader);
		if (!otherGroupState.length) {
			return this.getOtherRoomsGroupState(otherGroupHeader, sign);
		}
		return { state: otherGroupState, header: otherGroupHeader };
	}

	// Go to previous or next room based on sign (-1 or 1)
	// It's used by iPad key commands
	goOtherRoom = (sign) => {
		if (!this.header || !this.item) {
			return;
		}
		// Don't run during search
		const { search } = this.state;
		if (search.length > 0) {
			return;
		}
		const roomsGroup = this.getRoomsGroupState(this.header);
		const roomIndex = roomsGroup.findIndex(c => c.rid === this.item.rid);
		const otherRoomInGroup = roomsGroup[roomIndex + sign];

		// If other room is on the same group
		if (otherRoomInGroup) {
			this.goRoom(otherRoomInGroup, this.header);

		// if other room is NOT on the same group
		} else {
			const { state: otherRoomsGroupState, header: otherRoomsGroupHeader } = this.getOtherRoomsGroupState(this.header, sign);
			if (otherRoomsGroupHeader) {
				const index = sign === 1 ? 0 : otherRoomsGroupState.length - 1;
				this.goRoom(otherRoomsGroupState[index], otherRoomsGroupHeader);
			}
		}
	}

	handleCommands = ({ event }) => {
		const { chats } = this.state;
		const {
			navigation, server, showUnread, showFavorites, groupByType
		} = this.props;
		const { input } = event;
		if (handleCommandShowPreferences(event)) {
			navigation.toggleDrawer();
		} else if (handleCommandSearching(event)) {
			this.scroll.scrollToOffset({ animated: true, offset: 0 });
			this.inputRef.focus();
		} else if (handleCommandSelectRoom(event)) {
			// Disabled when grouped for now
			if (showUnread || showFavorites || groupByType) {
				return;
			}
			if (chats[input - 1]) {
				this.goRoom(chats[input - 1]);
			}
		} else if (handleCommandPreviousRoom(event)) {
			this.goOtherRoom(-1);
		} else if (handleCommandNextRoom(event)) {
			this.goOtherRoom(1);
		} else if (handleCommandShowNewMessage(event)) {
			navigation.navigate('NewMessageView', { onPressItem: this._onPressItem });
		} else if (handleCommandAddNewServer(event)) {
			navigation.navigate('OnboardingView', { previousServer: server });
		}
	};

	getScrollRef = ref => (this.scroll = ref);

	renderListHeader = () => {
		const { search } = this.state;
		const { sortBy } = this.props;
		return (
			<ListHeader
				inputRef={(ref) => { this.inputRef = ref; }}
				searchLength={search.length}
				sortBy={sortBy}
				onChangeSearchText={this.search}
				toggleSort={this.toggleSort}
				goDirectory={this.goDirectory}
			/>
		);
	};

	getIsRead = (item) => {
		let isUnread = item.archived !== true && item.open === true; // item is not archived and not opened
		isUnread = isUnread && (item.unread > 0 || item.alert === true); // either its unread count > 0 or its alert
		return !isUnread;
	};

	renderItem = ({ item, header }) => {
		const { width } = this.state;
		const {
			userId,
			username,
			token,
			baseUrl,
			StoreLastMessage,
			split
		} = this.props;
		const id = item.rid.replace(userId, '').trim();

		return (
			<RoomItem
				alert={item.alert}
				unread={item.unread}
				hideUnreadStatus={item.hideUnreadStatus}
				userMentions={item.userMentions}
				isRead={this.getIsRead(item)}
				favorite={item.f}
				avatar={item.name}
				lastMessage={item.lastMessage}
				name={this.getRoomTitle(item)}
				_updatedAt={item.roomUpdatedAt}
				key={item._id}
				id={id}
				userId={userId}
				username={username}
				token={token}
				rid={item.rid}
				type={item.t}
				baseUrl={baseUrl}
				prid={item.prid}
				showLastMessage={StoreLastMessage}
				onPress={() => this._onPressItem(item, header)}
				testID={`rooms-list-view-item-${ item.name }`}
				width={split ? MAX_SIDEBAR_WIDTH : width}
				toggleFav={this.toggleFav}
				toggleRead={this.toggleRead}
				hideChannel={this.hideChannel}
			/>
		);
	};

	renderSectionHeader = header => (
		<View style={styles.groupTitleContainer}>
			<Text style={styles.groupTitle}>{I18n.t(header)}</Text>
		</View>
	);

	renderSection = (data, header) => {
		const { showUnread, showFavorites, groupByType } = this.props;

		if (header === UNREAD_HEADER && !showUnread) {
			return null;
		} else if (header === FAVORITES_HEADER && !showFavorites) {
			return null;
		} else if (
			[
				DISCUSSIONS_HEADER,
				CHANNELS_HEADER,
				DM_HEADER,
				GROUPS_HEADER
			].includes(header)
			&& !groupByType
		) {
			return null;
		} else if (header === CHATS_HEADER && groupByType) {
			return null;
		}
		if (data && data.length > 0) {
			return (
				<FlatList
					data={data}
					extraData={data}
					keyExtractor={keyExtractor}
					style={styles.list}
					renderItem={({ item }) => this.renderItem({ item, header })}
					ListHeaderComponent={() => this.renderSectionHeader(header)}
					getItemLayout={getItemLayout}
					enableEmptySections
					removeClippedSubviews={isIOS}
					keyboardShouldPersistTaps='always'
					initialNumToRender={INITIAL_NUM_TO_RENDER}
					windowSize={7}
				/>
			);
		}
		return null;
	};

	renderList = () => {
		const {
			search,
			chats,
			unread,
			favorites,
			discussions,
			channels,
			direct,
			privateGroup
		} = this.state;

		if (search.length > 0) {
			return (
				<FlatList
					data={search}
					extraData={search}
					keyExtractor={keyExtractor}
					style={styles.list}
					renderItem={({ item }) => this.renderItem({ item, header: 'Search' })}
					getItemLayout={getItemLayout}
					enableEmptySections
					removeClippedSubviews={isIOS}
					keyboardShouldPersistTaps='always'
					initialNumToRender={INITIAL_NUM_TO_RENDER}
					windowSize={7}
				/>
			);
		}

		return (
			<View style={styles.container}>
				{this.renderSection(unread, UNREAD_HEADER)}
				{this.renderSection(favorites, FAVORITES_HEADER)}
				{this.renderSection(discussions, DISCUSSIONS_HEADER)}
				{this.renderSection(channels, CHANNELS_HEADER)}
				{this.renderSection(direct, DM_HEADER)}
				{this.renderSection(privateGroup, GROUPS_HEADER)}
				{this.renderSection(chats, CHATS_HEADER)}
			</View>
		);
	};

	renderScroll = () => {
		const { loading } = this.state;

		if (loading) {
			return <ActivityIndicator style={styles.loading} />;
		}

		const { showUnread, showFavorites, groupByType } = this.props;
		if (!(showUnread || showFavorites || groupByType)) {
			const { chats, search } = this.state;
			return (
				<FlatList
					ref={this.getScrollRef}
					data={search.length ? search : chats}
					extraData={search.length ? search : chats}
					contentOffset={isIOS ? { x: 0, y: SCROLL_OFFSET } : {}}
					keyExtractor={keyExtractor}
					style={styles.list}
					renderItem={({ item }) => this.renderItem({ item, header: CHATS_HEADER })}
					ListHeaderComponent={this.renderListHeader}
					getItemLayout={getItemLayout}
					removeClippedSubviews={isIOS}
					keyboardShouldPersistTaps='always'
					initialNumToRender={INITIAL_NUM_TO_RENDER}
					windowSize={9}
				/>
			);
		}

		return (
			<ScrollView
				ref={this.getScrollRef}
				contentOffset={isIOS ? { x: 0, y: SCROLL_OFFSET } : {}}
				keyboardShouldPersistTaps='always'
				testID='rooms-list-view-list'
			>
				{this.renderListHeader()}
				{this.renderList()}
			</ScrollView>
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
			showSortDropdown
		} = this.props;

		return (
			<SafeAreaView
				style={styles.container}
				testID='rooms-list-view'
				forceInset={{ vertical: 'never' }}
			>
				<StatusBar />
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
				{showServerDropdown ? <ServerDropdown /> : null}
			</SafeAreaView>
		);
	};
}

const mapStateToProps = state => ({
	userId: state.login.user && state.login.user.id,
	username: state.login.user && state.login.user.username,
	token: state.login.user && state.login.user.token,
	server: state.server.server,
	baseUrl: state.settings.baseUrl || state.server ? state.server.server : '',
	searchText: state.rooms.searchText,
	loadingServer: state.server.loading,
	showServerDropdown: state.rooms.showServerDropdown,
	showSortDropdown: state.rooms.showSortDropdown,
	sortBy: state.sortPreferences.sortBy,
	groupByType: state.sortPreferences.groupByType,
	showFavorites: state.sortPreferences.showFavorites,
	showUnread: state.sortPreferences.showUnread,
	useRealName: state.settings.UI_Use_Real_Name,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background',
	StoreLastMessage: state.settings.Store_Last_Message
});

const mapDispatchToProps = dispatch => ({
	toggleSortDropdown: () => dispatch(toggleSortDropdownAction()),
	openSearchHeader: () => dispatch(openSearchHeaderAction()),
	closeSearchHeader: () => dispatch(closeSearchHeaderAction()),
	appStart: () => dispatch(appStartAction()),
	roomsRequest: () => dispatch(roomsRequestAction()),
	selectServerRequest: server => dispatch(selectServerRequestAction(server)),
	closeServerDropdown: () => dispatch(closeServerDropdownAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(withSplit(RoomsListView));

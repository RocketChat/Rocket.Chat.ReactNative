import React from 'react';
import PropTypes from 'prop-types';
import {
	View, FlatList, BackHandler, ActivityIndicator, Text, ScrollView, Keyboard, LayoutAnimation
} from 'react-native';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import { SafeAreaView, NavigationEvents } from 'react-navigation';
import Orientation from 'react-native-orientation-locker';

import SearchBox from '../../containers/SearchBox';
import ConnectionBadge from '../../containers/ConnectionBadge';
import database, { safeAddListener } from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import RoomItem, { ROW_HEIGHT } from '../../presentation/RoomItem';
import styles from './styles';
import LoggedView from '../View';
import log from '../../utils/log';
import I18n from '../../i18n';
import SortDropdown from './SortDropdown';
import ServerDropdown from './ServerDropdown';
import Touch from '../../utils/touch';
import {
	toggleSortDropdown as toggleSortDropdownAction,
	openSearchHeader as openSearchHeaderAction,
	closeSearchHeader as closeSearchHeaderAction
	// roomsRequest as roomsRequestAction
} from '../../actions/rooms';
import { appStart as appStartAction } from '../../actions';
import debounce from '../../utils/debounce';
import { isIOS, isAndroid } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import RoomsListHeaderView from './Header';
import { DrawerButton, CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';

const SCROLL_OFFSET = 56;

const shouldUpdateProps = ['searchText', 'loadingServer', 'showServerDropdown', 'showSortDropdown', 'sortBy', 'groupByType', 'showFavorites', 'showUnread', 'useRealName', 'StoreLastMessage', 'appState'];
const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.rid;

@connect(state => ({
	userId: state.login.user && state.login.user.id,
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
}), dispatch => ({
	toggleSortDropdown: () => dispatch(toggleSortDropdownAction()),
	openSearchHeader: () => dispatch(openSearchHeaderAction()),
	closeSearchHeader: () => dispatch(closeSearchHeaderAction()),
	appStart: () => dispatch(appStartAction())
	// roomsRequest: () => dispatch(roomsRequestAction())
}))
/** @extends React.Component */
export default class RoomsListView extends LoggedView {
	static navigationOptions = ({ navigation }) => {
		const searching = navigation.getParam('searching');
		const cancelSearchingAndroid = navigation.getParam('cancelSearchingAndroid');
		const onPressItem = navigation.getParam('onPressItem', () => {});
		const initSearchingAndroid = navigation.getParam('initSearchingAndroid', () => {});

		return {
			headerLeft: (
				searching
					? (
						<CustomHeaderButtons left>
							<Item title='cancel' iconName='cross' onPress={cancelSearchingAndroid} />
						</CustomHeaderButtons>
					)
					: <DrawerButton navigation={navigation} testID='rooms-list-view-sidebar' />
			),
			headerTitle: <RoomsListHeaderView />,
			headerRight: (
				searching
					? null
					: (
						<CustomHeaderButtons>
							{isAndroid ? <Item title='search' iconName='magnifier' onPress={initSearchingAndroid} /> : null}
							<Item title='new' iconName='edit-rounded' onPress={() => navigation.navigate('NewMessageView', { onPressItem })} testID='rooms-list-view-create-channel' />
						</CustomHeaderButtons>
					)
			)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		userId: PropTypes.string,
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
		// appState: PropTypes.string,
		toggleSortDropdown: PropTypes.func,
		openSearchHeader: PropTypes.func,
		closeSearchHeader: PropTypes.func,
		appStart: PropTypes.func
		// roomsRequest: PropTypes.func
	}

	constructor(props) {
		super('RoomsListView', props);

		this.data = [];
		this.state = {
			searching: false,
			search: [],
			loading: true,
			chats: [],
			unread: [],
			favorites: [],
			discussions: [],
			channels: [],
			privateGroup: [],
			direct: [],
			livechat: []
		};
		Orientation.unlockAllOrientations();
	}

	componentDidMount() {
		this.getSubscriptions();
		const { navigation } = this.props;
		navigation.setParams({
			onPressItem: this._onPressItem, initSearchingAndroid: this.initSearchingAndroid, cancelSearchingAndroid: this.cancelSearchingAndroid
		});
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
		// eslint-disable-next-line react/destructuring-assignment
		const propsUpdated = shouldUpdateProps.some(key => nextProps[key] !== this.props[key]);
		if (propsUpdated) {
			return true;
		}

		const { loading, searching } = this.state;
		if (nextState.loading !== loading) {
			return true;
		}
		if (nextState.searching !== searching) {
			return true;
		}

		const { showUnread, showFavorites, groupByType } = this.props;
		if (showUnread) {
			const { unread } = this.state;
			if (!isEqual(nextState.unread, unread)) {
				return true;
			}
		}
		if (showFavorites) {
			const { favorites } = this.state;
			if (!isEqual(nextState.favorites, favorites)) {
				return true;
			}
		}
		if (groupByType) {
			const {
				dicussions, channels, privateGroup, direct, livechat
			} = this.state;
			if (!isEqual(nextState.dicussions, dicussions)) {
				return true;
			}
			if (!isEqual(nextState.channels, channels)) {
				return true;
			}
			if (!isEqual(nextState.privateGroup, privateGroup)) {
				return true;
			}
			if (!isEqual(nextState.direct, direct)) {
				return true;
			}
			if (!isEqual(nextState.livechat, livechat)) {
				return true;
			}
		} else {
			const { chats } = this.state;
			if (!isEqual(nextState.chats, chats)) {
				return true;
			}
		}

		const { search } = this.state;
		if (!isEqual(nextState.search, search)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		const {
			sortBy, groupByType, showFavorites, showUnread
		} = this.props;

		if (!(
			(prevProps.sortBy === sortBy)
			&& (prevProps.groupByType === groupByType)
			&& (prevProps.showFavorites === showFavorites)
			&& (prevProps.showUnread === showUnread)
		)) {
			this.getSubscriptions();
		}
		// removed for now... we may not need it anymore
		// else if (appState === 'foreground' && appState !== prevProps.appState) {
		// 	// roomsRequest();
		// }
	}

	componentWillUnmount() {
		this.removeListener(this.data);
		this.removeListener(this.unread);
		this.removeListener(this.favorites);
		this.removeListener(this.discussions);
		this.removeListener(this.channels);
		this.removeListener(this.privateGroup);
		this.removeListener(this.direct);
		this.removeListener(this.livechat);
	}

	internalSetState = (...args) => {
		const { navigation } = this.props;
		if (isIOS && navigation.isFocused()) {
			LayoutAnimation.easeInEaseOut();
		}
		this.setState(...args);
	}

	getSubscriptions = () => {
		const {
			server, sortBy, showUnread, showFavorites, groupByType
		} = this.props;

		if (server && this.hasActiveDB()) {
			this.data = database.objects('subscriptions').filtered('archived != true && open == true && t != $0', 'l');
			if (sortBy === 'alphabetical') {
				this.data = this.data.sorted('name', false);
			} else {
				this.data = this.data.sorted('roomUpdatedAt', true);
			}

			let chats = [];
			let unread = [];
			let favorites = [];
			let discussions = [];
			let channels = [];
			let privateGroup = [];
			let direct = [];
			let livechat = [];

			// unread
			if (showUnread) {
				this.unread = this.data.filtered('(unread > 0 || alert == true)');
				unread = this.removeRealmInstance(this.unread);
				safeAddListener(this.unread, debounce(() => this.internalSetState({ unread: this.removeRealmInstance(this.unread) }), 300));
			} else {
				this.removeListener(unread);
			}
			// favorites
			if (showFavorites) {
				this.favorites = this.data.filtered('f == true');
				favorites = this.removeRealmInstance(this.favorites);
				safeAddListener(this.favorites, debounce(() => this.internalSetState({ favorites: this.removeRealmInstance(this.favorites) }), 300));
			} else {
				this.removeListener(favorites);
			}
			// type
			if (groupByType) {
				// discussions
				this.discussions = this.data.filtered('prid != null');
				discussions = this.removeRealmInstance(this.discussions);

				// channels
				this.channels = this.data.filtered('t == $0 AND prid == null', 'c');
				channels = this.removeRealmInstance(this.channels);

				// private
				this.privateGroup = this.data.filtered('t == $0 AND prid == null', 'p');
				privateGroup = this.removeRealmInstance(this.privateGroup);

				// direct
				this.direct = this.data.filtered('t == $0 AND prid == null', 'd');
				direct = this.removeRealmInstance(this.direct);

				// livechat
				this.livechat = this.data.filtered('t == $0 AND prid == null', 'l');
				livechat = this.removeRealmInstance(this.livechat);

				safeAddListener(this.discussions, debounce(() => this.internalSetState({ discussions: this.removeRealmInstance(this.discussions) }), 300));
				safeAddListener(this.channels, debounce(() => this.internalSetState({ channels: this.removeRealmInstance(this.channels) }), 300));
				safeAddListener(this.privateGroup, debounce(() => this.internalSetState({ privateGroup: this.removeRealmInstance(this.privateGroup) }), 300));
				safeAddListener(this.direct, debounce(() => this.internalSetState({ direct: this.removeRealmInstance(this.direct) }), 300));
				safeAddListener(this.livechat, debounce(() => this.internalSetState({ livechat: this.removeRealmInstance(this.livechat) }), 300));
				this.removeListener(this.chats);
			} else {
				// chats
				if (showUnread) {
					this.chats = this.data.filtered('(unread == 0 && alert == false)');
				} else {
					this.chats = this.data;
				}
				chats = this.removeRealmInstance(this.chats);

				safeAddListener(this.chats, debounce(() => this.internalSetState({ chats: this.removeRealmInstance(this.chats) }), 300));
				this.removeListener(this.discussions);
				this.removeListener(this.channels);
				this.removeListener(this.privateGroup);
				this.removeListener(this.direct);
				this.removeListener(this.livechat);
			}

			// setState
			this.internalSetState({
				chats, unread, favorites, discussions, channels, privateGroup, direct, livechat, loading: false
			});
		}
	}

	removeRealmInstance = (data) => {
		const array = Array.from(data);
		return JSON.parse(JSON.stringify(array));
	}

	removeListener = (data) => {
		if (data && data.removeAllListeners) {
			data.removeAllListeners();
		}
	}

	initSearchingAndroid = () => {
		const { openSearchHeader, navigation } = this.props;
		this.setState({ searching: true });
		navigation.setParams({ searching: true });
		openSearchHeader();
	}

	cancelSearchingAndroid = () => {
		if (isAndroid) {
			const { closeSearchHeader, navigation } = this.props;
			this.setState({ searching: false });
			navigation.setParams({ searching: false });
			closeSearchHeader();
			this.internalSetState({ search: [] });
			Keyboard.dismiss();
		}
	}

	// this is necessary during development (enables Cmd + r)
	hasActiveDB = () => database && database.databases && database.databases.activeDB;

	handleBackPress = () => {
		const { searching } = this.state;
		const { appStart } = this.props;
		if (searching) {
			this.cancelSearchingAndroid();
			return true;
		}
		appStart('background');
		return false;
	}

	_isUnread = item => item.unread > 0 || item.alert

	search = async(text) => {
		const result = await RocketChat.search({ text });
		this.internalSetState({
			search: result
		});
	}

	getRoomTitle = (item) => {
		const { useRealName } = this.props;
		return ((item.prid || useRealName) && item.fname) || item.name;
	}

	goRoom = (item) => {
		this.cancelSearchingAndroid();
		const { navigation } = this.props;
		navigation.navigate('RoomView', {
			rid: item.rid, name: this.getRoomTitle(item), t: item.t, prid: item.prid
		});
	}

	_onPressItem = async(item = {}) => {
		if (!item.search) {
			return this.goRoom(item);
		}
		if (item.t === 'd') {
			// if user is using the search we need first to join/create room
			try {
				const { username } = item;
				const result = await RocketChat.createDirectMessage(username);
				if (result.success) {
					return this.goRoom({ rid: result.room._id, name: username, t: 'd' });
				}
			} catch (e) {
				log('RoomsListView._onPressItem', e);
			}
		} else {
			return this.goRoom(item);
		}
	}

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
	}

	getScrollRef = ref => this.scroll = ref

	renderHeader = () => {
		const { search } = this.state;
		if (search.length > 0) {
			return null;
		}
		return this.renderSort();
	}

	renderSort = () => {
		const { sortBy } = this.props;

		return (
			<Touch
				key='rooms-list-view-sort'
				onPress={this.toggleSort}
				style={styles.dropdownContainerHeader}
			>
				<View style={styles.sortItemContainer}>
					<Text style={styles.sortToggleText}>{I18n.t('Sorting_by', { key: I18n.t(sortBy === 'alphabetical' ? 'name' : 'activity') })}</Text>
					<CustomIcon style={styles.sortIcon} size={22} name='sort1' />
				</View>
			</Touch>
		);
	}

	renderSearchBar = () => {
		if (isIOS) {
			return <SearchBox onChangeText={this.search} testID='rooms-list-view-search' key='rooms-list-view-search' />;
		}
	}

	renderListHeader = () => (
		[
			this.renderSearchBar(),
			this.renderHeader()
		]
	)

	renderItem = ({ item }) => {
		const {
			userId, baseUrl, StoreLastMessage
		} = this.props;
		const id = item.rid.replace(userId, '').trim();

		return (
			<RoomItem
				alert={item.alert}
				unread={item.unread}
				userMentions={item.userMentions}
				favorite={item.f}
				lastMessage={item.lastMessage}
				name={this.getRoomTitle(item)}
				_updatedAt={item.roomUpdatedAt}
				key={item._id}
				id={id}
				type={item.t}
				baseUrl={baseUrl}
				prid={item.prid}
				showLastMessage={StoreLastMessage}
				onPress={() => this._onPressItem(item)}
				testID={`rooms-list-view-item-${ item.name }`}
				height={ROW_HEIGHT}
			/>
		);
	}

	renderSectionHeader = header => (
		<View style={styles.groupTitleContainer}>
			<Text style={styles.groupTitle}>{I18n.t(header)}</Text>
		</View>
	)

	renderSection = (data, header) => {
		const { showUnread, showFavorites, groupByType } = this.props;

		if (header === 'Unread' && !showUnread) {
			return null;
		} else if (header === 'Favorites' && !showFavorites) {
			return null;
		} else if (['Discussions', 'Channels', 'Direct_Messages', 'Private_Groups', 'Livechat'].includes(header) && !groupByType) {
			return null;
		} else if (header === 'Chats' && groupByType) {
			return null;
		}
		if (data.length > 0) {
			return (
				<FlatList
					data={data}
					extraData={data}
					keyExtractor={keyExtractor}
					style={styles.list}
					renderItem={this.renderItem}
					ListHeaderComponent={() => this.renderSectionHeader(header)}
					getItemLayout={getItemLayout}
					enableEmptySections
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
					initialNumToRender={12}
					windowSize={7}
				/>
			);
		}
		return null;
	}

	renderList = () => {
		const {
			search, chats, unread, favorites, discussions, channels, direct, privateGroup, livechat
		} = this.state;

		if (search.length > 0) {
			return (
				<FlatList
					data={search}
					extraData={search}
					keyExtractor={keyExtractor}
					style={styles.list}
					renderItem={this.renderItem}
					getItemLayout={getItemLayout}
					enableEmptySections
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
					initialNumToRender={12}
					windowSize={7}
				/>
			);
		}

		return (
			<View style={styles.container}>
				{this.renderSection(unread, 'Unread')}
				{this.renderSection(favorites, 'Favorites')}
				{this.renderSection(discussions, 'Discussions')}
				{this.renderSection(channels, 'Channels')}
				{this.renderSection(direct, 'Direct_Messages')}
				{this.renderSection(privateGroup, 'Private_Groups')}
				{this.renderSection(livechat, 'Livechat')}
				{this.renderSection(chats, 'Chats')}
			</View>
		);
	}

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
					renderItem={this.renderItem}
					ListHeaderComponent={this.renderListHeader}
					getItemLayout={getItemLayout}
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
					initialNumToRender={9}
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
	}

	render = () => {
		const {
			sortBy, groupByType, showFavorites, showUnread, showServerDropdown, showSortDropdown
		} = this.props;

		return (
			<SafeAreaView style={styles.container} testID='rooms-list-view' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				{this.renderScroll()}
				{showSortDropdown
					? (
						<SortDropdown
							close={this.toggleSort}
							sortBy={sortBy}
							groupByType={groupByType}
							showFavorites={showFavorites}
							showUnread={showUnread}
						/>
					)
					: null
				}
				{showServerDropdown ? <ServerDropdown navigator={navigator} /> : null}
				<ConnectionBadge />
				<NavigationEvents
					onDidFocus={() => BackHandler.addEventListener('hardwareBackPress', this.handleBackPress)}
					onWillBlur={() => BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress)}
				/>
			</SafeAreaView>
		);
	}
}

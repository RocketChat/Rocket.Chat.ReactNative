import React from 'react';
import PropTypes from 'prop-types';
import {
	View, FlatList, BackHandler, ActivityIndicator, Text, Image, Dimensions, ScrollView, Keyboard, LayoutAnimation
} from 'react-native';
import { connect, Provider } from 'react-redux';
import { isEqual } from 'lodash';
import { Navigation } from 'react-native-navigation';
import SafeAreaView from 'react-native-safe-area-view';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import SearchBox from '../../containers/SearchBox';
import ConnectionBadge from '../../containers/ConnectionBadge';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import RoomItem from '../../presentation/RoomItem';
import styles from './styles';
import LoggedView from '../View';
import log from '../../utils/log';
import I18n from '../../i18n';
import SortDropdown from './SortDropdown';
import ServerDropdown from './ServerDropdown';
import Touch from '../../utils/touch';
import { toggleSortDropdown as toggleSortDropdownAction, openSearchHeader as openSearchHeaderAction, closeSearchHeader as closeSearchHeaderAction } from '../../actions/rooms';
import { appStart as appStartAction } from '../../actions';
import store from '../../lib/createStore';
import Drawer from '../../Drawer';
import debounce from '../../utils/debounce';
import { isIOS, isAndroid } from '../../utils/deviceInfo';

const ROW_HEIGHT = 70;
const SCROLL_OFFSET = 56;

const shouldUpdateProps = ['searchText', 'loadingServer', 'showServerDropdown', 'showSortDropdown', 'sortBy', 'groupByType', 'showFavorites', 'showUnread', 'useRealName', 'appState'];
const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.rid;

const leftButtons = [{
	id: 'settings',
	icon: { uri: 'settings', scale: Dimensions.get('window').scale },
	testID: 'rooms-list-view-sidebar'
}];
const rightButtons = [{
	id: 'newMessage',
	icon: { uri: 'new_channel', scale: Dimensions.get('window').scale },
	testID: 'rooms-list-view-create-channel'
}];

if (isAndroid) {
	rightButtons.push({
		id: 'search',
		icon: { uri: 'search', scale: Dimensions.get('window').scale }
	});
}

let NewMessageView = null;

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
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background'
}), dispatch => ({
	toggleSortDropdown: () => dispatch(toggleSortDropdownAction()),
	openSearchHeader: () => dispatch(openSearchHeaderAction()),
	closeSearchHeader: () => dispatch(closeSearchHeaderAction()),
	appStart: () => dispatch(appStartAction())
}))
/** @extends React.Component */
export default class RoomsListView extends LoggedView {
	static options() {
		return {
			topBar: {
				leftButtons,
				rightButtons,
				title: {
					component: {
						name: 'RoomsListHeaderView',
						alignment: isAndroid ? 'left' : 'center'
					}
				}
			},
			sideMenu: {
				left: {
					enabled: true
				},
				right: {
					enabled: true
				}
			},
			blurOnUnmount: true
		};
	}

	static propTypes = {
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
		appState: PropTypes.string,
		toggleSortDropdown: PropTypes.func,
		openSearchHeader: PropTypes.func,
		closeSearchHeader: PropTypes.func,
		appStart: PropTypes.func
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
			channels: [],
			privateGroup: [],
			direct: [],
			livechat: []
		};
		Navigation.events().bindComponent(this);
		BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
	}

	componentDidMount() {
		this.getSubscriptions();
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
				channels, privateGroup, direct, livechat
			} = this.state;
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
			sortBy, groupByType, showFavorites, showUnread, appState
		} = this.props;

		if (!(
			(prevProps.sortBy === sortBy)
			&& (prevProps.groupByType === groupByType)
			&& (prevProps.showFavorites === showFavorites)
			&& (prevProps.showUnread === showUnread)
		)) {
			this.getSubscriptions();
		} else if (appState === 'foreground' && appState !== prevProps.appState) {
			RocketChat.getRooms().catch(e => console.log(e));
		}
	}

	componentWillUnmount() {
		this.removeListener(this.data);
		this.removeListener(this.unread);
		this.removeListener(this.favorites);
		this.removeListener(this.channels);
		this.removeListener(this.privateGroup);
		this.removeListener(this.direct);
		this.removeListener(this.livechat);
		BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
	}

	navigationButtonPressed = ({ buttonId }) => {
		if (buttonId === 'newMessage') {
			if (NewMessageView == null) {
				NewMessageView = require('../NewMessageView').default;
				Navigation.registerComponentWithRedux('NewMessageView', () => gestureHandlerRootHOC(NewMessageView), Provider, store);
			}

			Navigation.showModal({
				stack: {
					children: [{
						component: {
							name: 'NewMessageView',
							passProps: {
								onPressItem: this._onPressItem
							},
							options: {
								topBar: {
									title: {
										text: I18n.t('New_Message')
									}
								}
							}
						}
					}]
				}
			});
		} else if (buttonId === 'settings') {
			Drawer.toggle();
		} else if (buttonId === 'search') {
			this.initSearchingAndroid();
		} else if (buttonId === 'back') {
			this.cancelSearchingAndroid();
		}
	}

	internalSetState = (...args) => {
		if (isIOS) {
			LayoutAnimation.easeInEaseOut();
		}
		this.setState(...args);
	}

	getSubscriptions = () => {
		const {
			server, sortBy, showUnread, showFavorites, groupByType
		} = this.props;

		if (server && this.hasActiveDB()) {
			if (sortBy === 'alphabetical') {
				this.data = database.objects('subscriptions').filtered('archived != true && open == true').sorted('name', false);
			} else {
				this.data = database.objects('subscriptions').filtered('archived != true && open == true').sorted('roomUpdatedAt', true);
			}

			let chats = [];
			let unread = [];
			let favorites = [];
			let channels = [];
			let privateGroup = [];
			let direct = [];
			let livechat = [];

			// unread
			if (showUnread) {
				this.unread = this.data.filtered('archived != true && open == true').filtered('(unread > 0 || alert == true)');
				unread = this.removeRealmInstance(this.unread);
				this.unread.addListener(debounce(() => this.internalSetState({ unread: this.removeRealmInstance(this.unread) }), 300));
			} else {
				this.removeListener(unread);
			}
			// favorites
			if (showFavorites) {
				this.favorites = this.data.filtered('f == true');
				favorites = this.removeRealmInstance(this.favorites);
				this.favorites.addListener(debounce(() => this.internalSetState({ favorites: this.removeRealmInstance(this.favorites) }), 300));
			} else {
				this.removeListener(favorites);
			}
			// type
			if (groupByType) {
				// channels
				this.channels = this.data.filtered('t == $0', 'c');
				channels = this.removeRealmInstance(this.channels);

				// private
				this.privateGroup = this.data.filtered('t == $0', 'p');
				privateGroup = this.removeRealmInstance(this.privateGroup);

				// direct
				this.direct = this.data.filtered('t == $0', 'd');
				direct = this.removeRealmInstance(this.direct);

				// livechat
				this.livechat = this.data.filtered('t == $0', 'l');
				livechat = this.removeRealmInstance(this.livechat);

				this.channels.addListener(debounce(() => this.internalSetState({ channels: this.removeRealmInstance(this.channels) }), 300));
				this.privateGroup.addListener(debounce(() => this.internalSetState({ privateGroup: this.removeRealmInstance(this.privateGroup) }), 300));
				this.direct.addListener(debounce(() => this.internalSetState({ direct: this.removeRealmInstance(this.direct) }), 300));
				this.livechat.addListener(debounce(() => this.internalSetState({ livechat: this.removeRealmInstance(this.livechat) }), 300));
				this.removeListener(this.chats);
			} else {
				// chats
				if (showUnread) {
					this.chats = this.data.filtered('(unread == 0 && alert == false)');
				} else {
					this.chats = this.data;
				}
				chats = this.removeRealmInstance(this.chats);

				this.chats.addListener(debounce(() => this.internalSetState({ chats: this.removeRealmInstance(this.chats) }), 300));
				this.removeListener(this.channels);
				this.removeListener(this.privateGroup);
				this.removeListener(this.direct);
				this.removeListener(this.livechat);
			}

			// setState
			this.internalSetState({
				chats, unread, favorites, channels, privateGroup, direct, livechat, loading: false
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
		const { openSearchHeader } = this.props;
		this.setState({ searching: true });
		openSearchHeader();
		Navigation.mergeOptions('RoomsListView', {
			topBar: {
				leftButtons: [{
					id: 'back',
					icon: { uri: 'back', scale: Dimensions.get('window').scale },
					testID: 'rooms-list-view-cancel-search'
				}],
				rightButtons: []
			}
		});
	}

	cancelSearchingAndroid = () => {
		if (isAndroid) {
			const { closeSearchHeader } = this.props;
			this.setState({ searching: false });
			closeSearchHeader();
			Navigation.mergeOptions('RoomsListView', {
				topBar: {
					leftButtons,
					rightButtons
				}
			});
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

	goRoom = ({ rid, name, t }) => {
		this.cancelSearchingAndroid();
		Navigation.push('RoomsListView', {
			component: {
				name: 'RoomView',
				passProps: {
					rid, name, t
				}
			}
		});
	}

	_onPressItem = async(item = {}) => {
		if (!item.search) {
			const { rid, name, t } = item;
			return this.goRoom({ rid, name, t });
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
			const { rid, name, t } = item;
			return this.goRoom({ rid, name, t });
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
					<Image style={styles.sortIcon} source={{ uri: 'group_type' }} />
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
		const { useRealName, userId, baseUrl } = this.props;
		const id = item.rid.replace(userId, '').trim();

		return (
			<RoomItem
				alert={item.alert}
				unread={item.unread}
				userMentions={item.userMentions}
				favorite={item.f}
				lastMessage={item.lastMessage}
				name={(useRealName && item.fname) || item.name}
				_updatedAt={item.roomUpdatedAt}
				key={item._id}
				id={id}
				type={item.t}
				baseUrl={baseUrl}
				onPress={() => this._onPressItem(item)}
				testID={`rooms-list-view-item-${ item.name }`}
				height={ROW_HEIGHT}
			/>
		);
	}

	renderSeparator = () => <View style={styles.separator} />

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
		} else if (['Channels', 'Direct_Messages', 'Private_Groups', 'Livechat'].includes(header) && !groupByType) {
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
					ItemSeparatorComponent={this.renderSeparator}
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
			search, chats, unread, favorites, channels, direct, privateGroup, livechat
		} = this.state;

		if (search.length > 0) {
			return (
				<FlatList
					data={search}
					extraData={search}
					keyExtractor={keyExtractor}
					style={styles.list}
					renderItem={this.renderItem}
					ItemSeparatorComponent={this.renderSeparator}
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
					ItemSeparatorComponent={this.renderSeparator}
					ListHeaderComponent={this.renderListHeader}
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
			</SafeAreaView>
		);
	}
}

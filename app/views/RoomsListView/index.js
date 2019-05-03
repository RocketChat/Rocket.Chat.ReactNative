import React from 'react';
import PropTypes from 'prop-types';
import {
	View, FlatList, BackHandler, ActivityIndicator, Text, ScrollView, Keyboard, LayoutAnimation, InteractionManager
} from 'react-native';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import { SafeAreaView } from 'react-navigation';
import Orientation from 'react-native-orientation-locker';

import database, { safeAddListener } from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import RoomItem, { ROW_HEIGHT } from '../../presentation/RoomItem';
import styles from './styles';
import LoggedView from '../View';
import log from '../../utils/log';
import I18n from '../../i18n';
import SortDropdown from './SortDropdown';
import ServerDropdown from './ServerDropdown';
import {
	toggleSortDropdown as toggleSortDropdownAction,
	openSearchHeader as openSearchHeaderAction,
	closeSearchHeader as closeSearchHeaderAction
	// roomsRequest as roomsRequestAction
} from '../../actions/rooms';
import { appStart as appStartAction } from '../../actions';
import debounce from '../../utils/debounce';
import { isIOS, isAndroid } from '../../utils/deviceInfo';
import RoomsListHeaderView from './Header';
import { DrawerButton, CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ListHeader from './ListHeader';

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
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);

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
		this.didFocusListener = props.navigation.addListener('didFocus', () => BackHandler.addEventListener('hardwareBackPress', this.handleBackPress));
		this.willBlurListener = props.navigation.addListener('willBlur', () => BackHandler.addEventListener('hardwareBackPress', this.handleBackPress));
	}

	componentDidMount() {
		this.getSubscriptions();
		const { navigation } = this.props;
		navigation.setParams({
			onPressItem: this._onPressItem, initSearchingAndroid: this.initSearchingAndroid, cancelSearchingAndroid: this.cancelSearchingAndroid
		});
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
		if (this.data && this.data.removeAllListeners) {
			this.data.removeAllListeners();
		}
		if (this.getSubscriptions && this.getSubscriptions.stop) {
			this.getSubscriptions.stop();
		}
		if (this.updateStateInteraction && this.updateStateInteraction.cancel) {
			this.updateStateInteraction.cancel();
		}
		if (this.didFocusListener && this.didFocusListener.remove) {
			this.didFocusListener.remove();
		}
		if (this.willBlurListener && this.willBlurListener.remove) {
			this.willBlurListener.remove();
		}
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	// eslint-disable-next-line react/sort-comp
	internalSetState = (...args) => {
		const { navigation } = this.props;
		if (isIOS && navigation.isFocused()) {
			LayoutAnimation.easeInEaseOut();
		}
		this.setState(...args);
	}

	getSubscriptions = debounce(() => {
		if (this.data && this.data.removeAllListeners) {
			this.data.removeAllListeners();
		}

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

			// unread
			if (showUnread) {
				this.unread = this.data.filtered('(unread > 0 || alert == true)');
			} else {
				this.unread = [];
			}
			// favorites
			if (showFavorites) {
				this.favorites = this.data.filtered('f == true');
			} else {
				this.favorites = [];
			}
			// type
			if (groupByType) {
				this.discussions = this.data.filtered('prid != null');
				this.channels = this.data.filtered('t == $0 AND prid == null', 'c');
				this.privateGroup = this.data.filtered('t == $0 AND prid == null', 'p');
				this.direct = this.data.filtered('t == $0 AND prid == null', 'd');
				this.livechat = this.data.filtered('t == $0 AND prid == null', 'l');
			} else if (showUnread) {
				this.chats = this.data.filtered('(unread == 0 && alert == false)');
			} else {
				this.chats = this.data;
			}
			safeAddListener(this.data, this.updateState);
		}
	}, 300);

	// eslint-disable-next-line react/sort-comp
	updateState = debounce(() => {
		this.updateStateInteraction = InteractionManager.runAfterInteractions(() => {
			this.internalSetState({
				chats: this.chats ? this.chats.slice() : [],
				unread: this.unread ? this.unread.slice() : [],
				favorites: this.favorites ? this.favorites.slice() : [],
				discussions: this.discussions ? this.discussions.slice() : [],
				channels: this.channels ? this.channels.slice() : [],
				privateGroup: this.privateGroup ? this.privateGroup.slice() : [],
				direct: this.direct ? this.direct.slice() : [],
				livechat: this.livechat ? this.livechat.slice() : [],
				loading: false
			});
			this.forceUpdate();
		});
	}, 300);

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

	renderListHeader = () => {
		const { search } = this.state;
		const { sortBy } = this.props;
		return (
			<ListHeader
				searchLength={search.length}
				sortBy={sortBy}
				onChangeSearchText={this.search}
				toggleSort={this.toggleSort}
			/>
		);
	}

	renderItem = ({ item }) => {
		const {
			userId, baseUrl, StoreLastMessage
		} = this.props;
		const id = item.rid.replace(userId, '').trim();

		if (item.search || (item.isValid && item.isValid())) {
			return (
				<RoomItem
					alert={item.alert}
					unread={item.unread}
					userMentions={item.userMentions}
					favorite={item.f}
					lastMessage={item.lastMessage ? JSON.parse(JSON.stringify(item.lastMessage)) : null}
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
		return null;
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
		if (data && data.length > 0) {
			return (
				<FlatList
					data={data}
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
		console.count(`${ this.constructor.name }.render calls`);
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
				{showServerDropdown ? <ServerDropdown /> : null}
			</SafeAreaView>
		);
	}
}

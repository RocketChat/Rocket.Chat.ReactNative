import React from 'react';
import PropTypes from 'prop-types';
import { Platform, View, FlatList, BackHandler, ActivityIndicator, SafeAreaView, Text, Image, Dimensions, ScrollView, Keyboard } from 'react-native';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';

import SearchBox from '../../containers/SearchBox';
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
import { toggleSortDropdown } from '../../actions/rooms';

const ROW_HEIGHT = 70;
const SCROLL_OFFSET = 56;

const isAndroid = () => Platform.OS === 'android';
const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
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

if (Platform.OS === 'android') {
	rightButtons.push({
		id: 'search',
		icon: { uri: 'search', scale: Dimensions.get('window').scale }
	});
}

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
	useRealName: state.settings.UI_Use_Real_Name
}), dispatch => ({
	toggleSortDropdown: () => dispatch(toggleSortDropdown())
}))
/** @extends React.Component */
export default class RoomsListView extends LoggedView {
	static navigatorButtons = {
		leftButtons, rightButtons
	}

	static navigatorStyle = {
		navBarCustomView: 'RoomsListHeaderView',
		navBarComponentAlignment: 'fill',
		navBarBackgroundColor: isAndroid() ? '#2F343D' : undefined,
		navBarTextColor: isAndroid() ? '#FFF' : undefined,
		navBarButtonColor: isAndroid() ? '#FFF' : undefined
	}

	static propTypes = {
		navigator: PropTypes.object,
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
		toggleSortDropdown: PropTypes.func,
		useRealName: PropTypes.bool
	}

	constructor(props) {
		super('RoomsListView', props);

		this.data = [];
		this.state = {
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
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentWillMount() {
		this.initDefaultHeader();
	}

	componentDidMount() {
		this.getSubscriptions();
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.server && this.props.loadingServer !== nextProps.loadingServer) {
			if (nextProps.loadingServer) {
				this.setState({ loading: true });
			} else {
				this.getSubscriptions();
			}
		} else if (this.props.searchText !== nextProps.searchText) {
			this.search(nextProps.searchText);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		return !(isEqual(this.props, nextProps) && isEqual(this.state, nextState));
	}

	componentDidUpdate(prevProps) {
		if (!(
			(prevProps.sortBy === this.props.sortBy) &&
			(prevProps.groupByType === this.props.groupByType) &&
			(prevProps.showFavorites === this.props.showFavorites) &&
			(prevProps.showUnread === this.props.showUnread)
		)) {
			this.getSubscriptions();
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

		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	onNavigatorEvent(event) {
		const { navigator } = this.props;
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'newMessage') {
				this.props.navigator.showModal({
					screen: 'NewMessageView',
					title: I18n.t('New_Message'),
					passProps: {
						onPressItem: this._onPressItem
					}
				});
			} else if (event.id === 'settings') {
				navigator.toggleDrawer({
					side: 'left'
				});
			} else if (event.id === 'search') {
				this.initSearchingAndroid();
			} else if (event.id === 'cancelSearch' || event.id === 'back') {
				this.cancelSearchingAndroid();
			}
		} else if (event.type === 'ScreenChangedEvent' && event.id === 'didAppear') {
			navigator.setDrawerEnabled({
				side: 'left',
				enabled: true
			});
		}
	}

	getSubscriptions = () => {
		if (this.props.server && this.hasActiveDB()) {
			if (this.props.sortBy === 'alphabetical') {
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
			if (this.props.showUnread) {
				this.unread = this.data.filtered('archived != true && open == true').sorted('name', false).filtered('(unread > 0 || alert == true)');
				unread = this.unread.slice();
				setTimeout(() => {
					this.unread.addListener(() => this.setState({ unread: this.unread.slice() }));
				});
			} else {
				this.removeListener(unread);
			}
			// favorites
			if (this.props.showFavorites) {
				this.favorites = this.data.filtered('f == true');
				favorites = this.favorites.slice();
				setTimeout(() => {
					this.favorites.addListener(() => this.setState({ favorites: this.favorites.slice() }));
				});
			} else {
				this.removeListener(favorites);
			}
			// type
			if (this.props.groupByType) {
				// channels
				this.channels = this.data.filtered('t == $0', 'c');
				channels = this.channels.slice();
				// private
				this.privateGroup = this.data.filtered('t == $0', 'p');
				privateGroup = this.privateGroup.slice();
				// direct
				this.direct = this.data.filtered('t == $0', 'd');
				direct = this.direct.slice();
				// livechat
				this.livechat = this.data.filtered('t == $0', 'l');
				livechat = this.livechat.slice();
				setTimeout(() => {
					this.channels.addListener(() => this.setState({ channels: this.channels.slice() }));
					this.privateGroup.addListener(() => this.setState({ privateGroup: this.privateGroup.slice() }));
					this.direct.addListener(() => this.setState({ direct: this.direct.slice() }));
					this.livechat.addListener(() => this.setState({ livechat: this.livechat.slice() }));
				});
				this.removeListener(this.chats);
			} else {
				// chats
				this.chats = this.data.filtered('(unread == 0 && alert == false)');
				chats = this.chats.slice();
				setTimeout(() => {
					this.chats.addListener(() => this.setState({ chats: this.chats.slice() }));
				});
				this.removeListener(this.channels);
				this.removeListener(this.privateGroup);
				this.removeListener(this.direct);
				this.removeListener(this.livechat);
			}

			// setState
			this.setState({
				chats, unread, favorites, channels, privateGroup, direct, livechat
			});
		}
		this.timeout = setTimeout(() => {
			this.setState({ loading: false });
		}, 200);
	}

	removeListener = (data) => {
		if (data && data.removeAllListeners) {
			data.removeAllListeners();
		}
	}

	initDefaultHeader = () => {
		const { navigator } = this.props;
		navigator.setButtons({ leftButtons, rightButtons });
		navigator.setStyle({
			navBarCustomView: 'RoomsListHeaderView',
			navBarComponentAlignment: 'fill',
			navBarBackgroundColor: isAndroid() ? '#2F343D' : undefined,
			navBarTextColor: isAndroid() ? '#FFF' : undefined,
			navBarButtonColor: isAndroid() ? '#FFF' : undefined
		});
	}

	initSearchingAndroid = () => {
		const { navigator } = this.props;
		navigator.setButtons({
			leftButtons: [{
				id: 'cancelSearch',
				icon: { uri: 'back', scale: Dimensions.get('window').scale }
			}],
			rightButtons: []
		});
		navigator.setStyle({
			navBarCustomView: 'RoomsListSearchView',
			navBarComponentAlignment: 'fill'
		});
		BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
	}

	// this is necessary during development (enables Cmd + r)
	hasActiveDB = () => database && database.databases && database.databases.activeDB;

	cancelSearchingAndroid = () => {
		if (Platform.OS === 'android') {
			this.setState({ search: [] });
			this.initDefaultHeader();
			Keyboard.dismiss();
			BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
		}
	}

	handleBackPress = () => {
		this.cancelSearchingAndroid();
		return true;
	}

	_isUnread = item => item.unread > 0 || item.alert

	search = async(text) => {
		const result = await RocketChat.search({ text });
		this.setState({
			search: result
		});
	}

	goRoom = (rid, name) => {
		this.props.navigator.push({
			screen: 'RoomView',
			title: name,
			backButtonTitle: '',
			passProps: {
				room: { rid, name },
				rid,
				name
			}
		});
		this.cancelSearchingAndroid();
	}

	_onPressItem = async(item = {}) => {
		if (!item.search) {
			const { rid, name } = item;
			return this.goRoom(rid, name);
		}
		if (item.t === 'd') {
			// if user is using the search we need first to join/create room
			try {
				const { username } = item;
				const sub = await RocketChat.createDirectMessage(username);
				const { rid } = sub;
				return this.goRoom(rid, username);
			} catch (e) {
				log('RoomsListView._onPressItem', e);
			}
		} else {
			const { rid, name } = item;
			return this.goRoom(rid, name);
		}
	}

	toggleSort = () => {
		if (Platform.OS === 'ios') {
			this.scroll.scrollTo({ x: 0, y: SCROLL_OFFSET, animated: true });
		} else {
			this.scroll.scrollTo({ x: 0, y: 0, animated: true });
		}
		setTimeout(() => {
			this.props.toggleSortDropdown();
		}, 100);
	}

	renderHeader = () => {
		if (this.state.search.length > 0) {
			return null;
		}
		return this.renderSort();
	}

	renderSort = () => (
		<Touch
			onPress={this.toggleSort}
			style={styles.dropdownContainerHeader}
		>
			<View style={styles.sortItemContainer}>
				<Text style={styles.sortToggleText}>{I18n.t('Sorting_by', { key: I18n.t(this.props.sortBy === 'alphabetical' ? 'name' : 'activity') })}</Text>
				<Image style={styles.sortIcon} source={{ uri: 'group_type' }} />
			</View>
		</Touch>
	)

	renderSearchBar = () => {
		if (Platform.OS === 'ios') {
			return <SearchBox onChangeText={text => this.search(text)} testID='rooms-list-view-search' />;
		}
	}

	renderItem = ({ item }) => {
		const id = item.rid.replace(this.props.userId, '').trim();
		const { useRealName } = this.props;
		return (<RoomItem
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
			baseUrl={this.props.baseUrl}
			onPress={() => this._onPressItem(item)}
			testID={`rooms-list-view-item-${ item.name }`}
			height={ROW_HEIGHT}
		/>);
	}

	renderSeparator = () => <View style={styles.separator} />;

	renderSection = (data, header) => {
		if (header === 'Unread' && !this.props.showUnread) {
			return null;
		} else if (header === 'Favorites' && !this.props.showFavorites) {
			return null;
		} else if (['Channels', 'Direct_Messages', 'Private_Groups', 'Livechat'].includes(header) && !this.props.groupByType) {
			return null;
		} else if (header === 'Chats' && this.props.groupByType) {
			return null;
		}
		if (data.length > 0) {
			return (
				<FlatList
					data={data}
					extraData={data}
					keyExtractor={item => item.rid}
					style={styles.list}
					renderItem={this.renderItem}
					ItemSeparatorComponent={this.renderSeparator}
					ListHeaderComponent={() => (
						<View style={styles.groupTitleContainer}>
							<Text style={styles.groupTitle}>{I18n.t(header)}</Text>
						</View>
					)}
					getItemLayout={getItemLayout}
					enableEmptySections
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
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
					keyExtractor={item => item.rid}
					style={styles.list}
					renderItem={this.renderItem}
					ItemSeparatorComponent={this.renderSeparator}
					getItemLayout={getItemLayout}
					enableEmptySections
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
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
		if (this.state.loading) {
			return <ActivityIndicator style={styles.loading} />;
		}

		return (
			<ScrollView
				ref={ref => this.scroll = ref}
				contentOffset={Platform.OS === 'ios' ? { x: 0, y: SCROLL_OFFSET } : {}}
				keyboardShouldPersistTaps='always'
				testID='rooms-list-view-list'
			>
				{this.renderSearchBar()}
				{this.renderHeader()}
				{this.renderList()}
			</ScrollView>
		);
	}

	render = () => {
		const {
			sortBy, groupByType, showFavorites, showUnread, showServerDropdown, showSortDropdown
		} = this.props;

		return (
			<SafeAreaView style={styles.container} testID='rooms-list-view'>
				{this.renderScroll()}
				{showSortDropdown ?
					<SortDropdown
						close={this.toggleSort}
						sortBy={sortBy}
						groupByType={groupByType}
						showFavorites={showFavorites}
						showUnread={showUnread}
					/> :
					null}
				{showServerDropdown ? <ServerDropdown navigator={this.props.navigator} /> : null}
			</SafeAreaView>
		);
	}
}

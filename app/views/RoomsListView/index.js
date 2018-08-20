import React from 'react';
import PropTypes from 'prop-types';
import { Platform, View, TextInput, FlatList, BackHandler, ActivityIndicator, SafeAreaView, Text, Image, SectionList, Dimensions, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';

import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import RoomItem from '../../presentation/RoomItem';
import styles from './styles';
import debounce from '../../utils/debounce';
import LoggedView from '../View';
import log from '../../utils/log';
import I18n from '../../i18n';
import SortDropdown from './SortDropdown';
import ServerDropdown from './ServerDropdown';
import Touch from './touch';
import { toggleSortDropdown } from '../../actions/rooms';

const ROW_HEIGHT = 70;

const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });

@connect((state) => {
	let result = {
		userId: state.login.user && state.login.user.id,
		server: state.server.server,
		Site_Url: state.settings.Site_Url,
		searchText: state.rooms.searchText,
		loadingServer: state.server.loading,
		showServerDropdown: state.rooms.showServerDropdown,
		showSortDropdown: state.rooms.showSortDropdown,
		sidebarSortby: null,
		sidebarGroupByType: null,
		sidebarShowFavorites: null,
		sidebarShowUnread: null
	};
	if (state.login && state.login.user && state.login.user.settings && state.login.user.settings.preferences) {
		result = {
			...result,
			sidebarSortby: state.login.user.settings.preferences.sidebarSortby,
			sidebarGroupByType: state.login.user.settings.preferences.sidebarGroupByType,
			sidebarShowFavorites: state.login.user.settings.preferences.sidebarShowFavorites,
			sidebarShowUnread: state.login.user.settings.preferences.sidebarShowUnread
		};
	}
	return result;
}, dispatch => ({
	toggleSortDropdown: () => dispatch(toggleSortDropdown())
}))
/** @extends React.Component */
export default class RoomsListView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		userId: PropTypes.string,
		Site_Url: PropTypes.string,
		server: PropTypes.string,
		searchText: PropTypes.string,
		loadingServer: PropTypes.bool,
		showServerDropdown: PropTypes.bool,
		showSortDropdown: PropTypes.bool,
		sidebarSortby: PropTypes.string,
		sidebarGroupByType: PropTypes.bool,
		sidebarShowFavorites: PropTypes.bool,
		sidebarShowUnread: PropTypes.bool,
		toggleSortDropdown: PropTypes.func
	}

	constructor(props) {
		super('RoomsListView', props);

		this.state = {
			search: [],
			rooms: [],
			loading: true,
			showGroup: false
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
		if (prevProps.sidebarSortby !== this.props.sidebarSortby) {
			if (this.props.sidebarSortby === 'alphabetical') {
				this.data = database.objects('subscriptions').filtered('archived != true && open == true').sorted('name', false);
			} else {
				this.data = database.objects('subscriptions').filtered('archived != true && open == true').sorted('roomUpdatedAt', true);
			}
			this.updateState();
		} else if (!(
			(prevProps.sidebarGroupByType === this.props.sidebarGroupByType) &&
			(prevProps.sidebarShowFavorites === this.props.sidebarShowFavorites) &&
			(prevProps.sidebarShowUnread === this.props.sidebarShowUnread)
		)) {
			this.updateState();
		}
	}

	componentWillUnmount() {
		this.updateState.stop();
		if (this.data) {
			this.data.removeAllListeners();
		}
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	onNavigatorEvent(event) {
		const { navigator } = this.props;
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'createChannel') {
				this.props.navigator.push({
					screen: 'SelectedUsersView',
					title: I18n.t('Select_Users'),
					passProps: {
						nextAction: 'CREATE_CHANNEL'
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

	onSearchChangeText(text) {
		this.search(text);
	}

	getSubscriptions = () => {
		if (this.data && this.data.removeListener) {
			this.data.removeListener(this.updateState);
		}
		if (this.props.server && this.hasActiveDB()) {
			if (this.props.sidebarSortby === 'alphabetical') {
				this.data = database.objects('subscriptions').filtered('archived != true && open == true').sorted('name', false);
			} else {
				this.data = database.objects('subscriptions').filtered('archived != true && open == true').sorted('roomUpdatedAt', true);
			}
			this.data.addListener(this.updateState);
		}
		this.timeout = setTimeout(() => {
			this.setState({ loading: false });
		}, 200);
	}

	initDefaultHeader = () => {
		const { navigator } = this.props;
		const rightButtons = [{
			id: 'createChannel',
			icon: { uri: 'new_channel', scale: Dimensions.get('window').scale },
			testID: 'rooms-list-view-create-channel'
		}];

		if (Platform.OS === 'android') {
			rightButtons.push({
				id: 'search',
				icon: { uri: 'search', scale: Dimensions.get('window').scale }
			});
		}

		navigator.setButtons({
			leftButtons: [{
				id: 'settings',
				icon: { uri: 'settings', scale: Dimensions.get('window').scale },
				testID: 'rooms-list-view-sidebar'
			}],
			rightButtons
		});
		navigator.setStyle({
			navBarCustomView: 'RoomsListHeaderView'
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
			BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
		}
	}

	handleBackPress = () => {
		this.cancelSearchingAndroid();
		return true;
	}

	_isUnread = item => item.unread > 0 || item.alert

	updateState = debounce(() => {
		const { sidebarGroupByType, sidebarShowFavorites, sidebarShowUnread } = this.props;
		if (!(sidebarGroupByType || sidebarShowFavorites || sidebarShowUnread)) {
			return this.setState({ rooms: this.data.slice(), showGroup: false, loading: false });
		}

		this.setState({ loading: true });
		const unread = { title: I18n.t('Unread'), data: [] };
		const fav = { title: I18n.t('Favorites'), data: [] };
		const chats = { title: I18n.t('Chats'), data: [] };
		const channel = { title: I18n.t('Channels'), data: [] };
		const privateGroup = { title: I18n.t('Private_Groups'), data: [] };
		const direct = { title: I18n.t('Direct_Messages'), data: [] };
		const livechat = { title: I18n.t('Livechat'), data: [] };
		this.data.forEach((item) => {
			// Unread
			if (sidebarShowUnread && this._isUnread(item)) {
				unread.data.push(item);
			}
			// Favorites
			if (sidebarShowFavorites && item.f) {
				fav.data.push(item);
			} else {
				// eslint-disable-next-line
				if (!(sidebarShowUnread && this._isUnread(item))) {
					if (sidebarGroupByType) {
						switch (item.t) {
							case 'c':
								channel.data.push(item);
								break;
							case 'p':
								privateGroup.data.push(item);
								break;
							case 'd':
								direct.data.push(item);
								break;
							case 'l':
								livechat.data.push(item);
								break;
							default:
								break;
						}
					} else {
						chats.data.push(item);
					}
				}
			}
		});
		const rooms = unread.data.length ? [unread] : [];
		if (fav.data.length) {
			rooms.push(fav);
		}
		if (channel.data.length) {
			rooms.push(channel);
		}
		if (privateGroup.data.length) {
			rooms.push(privateGroup);
		}
		if (direct.data.length) {
			rooms.push(direct);
		}
		if (livechat.data.length) {
			rooms.push(livechat);
		}
		if (!sidebarGroupByType) {
			rooms.push(chats);
		}
		this.setState({ rooms, showGroup: true, loading: false });
	});

	async search(text) {
		const searchText = text.trim();
		if (searchText === '') {
			delete this.oldPromise;
			return this.setState({
				search: []
			});
		}

		let data = database.objects('subscriptions').filtered('name CONTAINS[c] $0', searchText).slice(0, 7);

		const usernames = data.map(sub => sub.name);
		try {
			if (data.length < 7) {
				if (this.oldPromise) {
					this.oldPromise('cancel');
				}

				const { users, rooms } = await Promise.race([
					RocketChat.spotlight(searchText, usernames, { users: true, rooms: true }),
					new Promise((resolve, reject) => this.oldPromise = reject)
				]);

				data = data.concat(users.map(user => ({
					...user,
					rid: user.username,
					name: user.username,
					t: 'd',
					search: true
				})), rooms.map(room => ({
					rid: room._id,
					...room,
					search: true
				})));

				delete this.oldPromise;
			}
			this.setState({
				search: data
			});
		} catch (e) {
			// alert(JSON.stringify(e));
		}
	}

	goRoom = (rid, name) => {
		this.props.navigator.push({
			screen: 'RoomView',
			title: name,
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

	toggleSort = () => this.props.toggleSortDropdown();

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
				<Text style={styles.sortToggleText}>{I18n.t('Sorting_by', { key: I18n.t(this.props.sidebarSortby === 'alphabetical' ? 'name' : 'activity') })}</Text>
				<Image style={styles.sortIcon} source={{ uri: 'group_type' }} />
			</View>
		</Touch>
	)

	renderSearchBar = () => {
		if (Platform.OS === 'ios') {
			return (
				<View style={styles.searchBoxView}>
					<TextInput
						underlineColorAndroid='transparent'
						style={styles.searchBox}
						onChangeText={text => this.onSearchChangeText(text)}
						returnKeyType='search'
						placeholder={I18n.t('Search')}
						clearButtonMode='while-editing'
						blurOnSubmit
						autoCorrect={false}
						autoCapitalize='none'
						testID='rooms-list-view-search'
					/>
				</View>
			);
		}
	}

	renderItem = ({ item }) => {
		const id = item.rid.replace(this.props.userId, '').trim();
		return (<RoomItem
			alert={item.alert}
			unread={item.unread}
			userMentions={item.userMentions}
			favorite={item.f}
			lastMessage={item.lastMessage}
			name={item.name}
			_updatedAt={item.roomUpdatedAt}
			key={item._id}
			id={id}
			type={item.t}
			baseUrl={this.props.Site_Url}
			onPress={() => this._onPressItem(item)}
			testID={`rooms-list-view-item-${ item.name }`}
			height={ROW_HEIGHT}
		/>);
	}

	renderSeparator = () => <View style={styles.separator} />;

	renderList = () => {
		const {
			loading, search, rooms, showGroup
		} = this.state;
		if (loading) {
			return <ActivityIndicator style={styles.loading} />;
		}
		if (!showGroup || search.length > 0) {
			return (
				<FlatList
					data={search.length > 0 ? search : rooms}
					extraData={search.length > 0 ? search : rooms}
					keyExtractor={item => item.rid}
					style={styles.list}
					renderItem={this.renderItem}
					ItemSeparatorComponent={this.renderSeparator}
					ListHeaderComponent={this.renderHeader}
					getItemLayout={getItemLayout}
					enableEmptySections
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
					testID='rooms-list-view-list'
				/>
			);
		}
		return (
			<SectionList
				sections={this.state.rooms}
				extraData={this.state.rooms}
				keyExtractor={item => item.rid}
				style={styles.list}
				renderItem={this.renderItem}
				ItemSeparatorComponent={this.renderSeparator}
				ListHeaderComponent={this.renderHeader}
				renderSectionHeader={({ section: { title } }) => (
					<View style={styles.groupTitleContainer}>
						<Text style={styles.groupTitle}>{title}</Text>
					</View>
				)}
				getItemLayout={getItemLayout}
				enableEmptySections
				removeClippedSubviews
				keyboardShouldPersistTaps='always'
				testID='rooms-list-view-list'
			/>
		);
	}

	render = () => {
		const {
			sidebarSortby, sidebarGroupByType, sidebarShowFavorites, sidebarShowUnread, showServerDropdown, showSortDropdown
		} = this.props;
		return (
			<SafeAreaView style={styles.container} testID='rooms-list-view'>
				<ScrollView
					contentOffset={Platform.OS === 'ios' ? { x: 0, y: 37 } : {}}
					keyboardShouldPersistTaps='always'
				>
					{this.renderSearchBar()}
					{this.renderList()}
				</ScrollView>
				{showSortDropdown ?
					<SortDropdown
						close={this.toggleSort}
						sidebarSortby={sidebarSortby}
						sidebarGroupByType={sidebarGroupByType}
						sidebarShowFavorites={sidebarShowFavorites}
						sidebarShowUnread={sidebarShowUnread}
					/> :
					null}
				{showServerDropdown ? <ServerDropdown navigator={this.props.navigator} /> : null}
			</SafeAreaView>
		);
	}
}

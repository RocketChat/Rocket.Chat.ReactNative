import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TextInput, Text, TouchableOpacity, SafeAreaView, FlatList, LayoutAnimation } from 'react-native';
import { connect } from 'react-redux';

import { addUser, removeUser, reset, setLoading } from '../actions/selectedUsers';
import database from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import RoomItem from '../presentation/RoomItem';
import Avatar from '../containers/Avatar';
import Loading from '../containers/Loading';
import debounce from '../utils/debounce';
import LoggedView from './View';
import I18n from '../i18n';
import log from '../utils/log';
import { iconsMap } from '../Icons';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'center'
	},
	safeAreaView: {
		flex: 1,
		backgroundColor: '#FFFFFF'
	},
	list: {
		width: '100%',
		backgroundColor: '#FFFFFF'
	},
	searchBoxView: {
		backgroundColor: '#eee'
	},
	searchBox: {
		backgroundColor: '#fff',
		margin: 5,
		borderRadius: 5,
		padding: 5,
		paddingLeft: 10,
		color: '#aaa'
	},
	selectItemView: {
		width: 80,
		height: 80,
		padding: 8,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},
	status: {
		bottom: -2,
		right: -2,
		borderWidth: 2,
		borderRadius: 12,
		width: 12,
		height: 12
	}
});

@connect(state => ({
	userId: state.login.user && state.login.user.id,
	Site_Url: state.settings.Site_Url,
	users: state.selectedUsers.users,
	loading: state.selectedUsers.loading
}), dispatch => ({
	addUser: user => dispatch(addUser(user)),
	removeUser: user => dispatch(removeUser(user)),
	reset: () => dispatch(reset()),
	setLoadingInvite: loading => dispatch(setLoading(loading))
}))
/** @extends React.Component */
export default class SelectedUsersView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		rid: PropTypes.string,
		nextAction: PropTypes.string.isRequired,
		userId: PropTypes.string,
		Site_Url: PropTypes.string,
		addUser: PropTypes.func.isRequired,
		removeUser: PropTypes.func.isRequired,
		reset: PropTypes.func.isRequired,
		users: PropTypes.array,
		loading: PropTypes.bool,
		setLoadingInvite: PropTypes.func
	};

	constructor(props) {
		super('SelectedUsersView', props);
		this.data = database.objects('subscriptions').filtered('t = $0', 'd').sorted('roomUpdatedAt', true);
		this.state = {
			search: []
		};
		this.data.addListener(this.updateState);
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentDidMount() {
		this.props.navigator.setDrawerEnabled({
			side: 'left',
			enabled: false
		});
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.users.length !== this.props.users.length) {
			const { length } = nextProps.users;
			const rightButtons = [];
			if (length > 0) {
				rightButtons.push({
					id: 'create',
					testID: 'selected-users-view-submit',
					icon: iconsMap.add
				});
			}
			this.props.navigator.setButtons({ rightButtons });
		}
	}

	componentWillUnmount() {
		this.updateState.stop();
		this.data.removeAllListeners();
		this.props.reset();
	}

	async onNavigatorEvent(event) {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'create') {
				const { nextAction, setLoadingInvite, navigator } = this.props;
				if (nextAction === 'CREATE_CHANNEL') {
					this.props.navigator.push({
						screen: 'CreateChannelView',
						title: I18n.t('Create_Channel')
					});
				} else {
					try {
						setLoadingInvite(true);
						await RocketChat.addUsersToRoom(this.props.rid);
						navigator.pop();
					} catch (e) {
						log('RoomActions Add User', e);
					} finally {
						setLoadingInvite(false);
					}
				}
			}
		}
	}

	onSearchChangeText(text) {
		this.search(text);
	}

	updateState = debounce(() => {
		this.forceUpdate();
	}, 1000);

	async search(text) {
		const searchText = text.trim();
		if (searchText === '') {
			delete this.oldPromise;
			return this.setState({
				search: []
			});
		}

		let data = this.data.filtered('name CONTAINS[c] $0 AND t = $1', searchText, 'd').slice(0, 7);

		const usernames = data.map(sub => sub.map);
		try {
			if (data.length < 7) {
				if (this.oldPromise) {
					this.oldPromise('cancel');
				}

				const { users } = await Promise.race([
					RocketChat.spotlight(searchText, usernames, { users: true, rooms: false }),
					new Promise((resolve, reject) => this.oldPromise = reject)
				]);

				data = users.map(user => ({
					...user,
					rid: user.username,
					name: user.username,
					t: 'd',
					search: true
				}));

				delete this.oldPromise;
			}
			this.setState({
				search: data
			});
		} catch (e) {
			// alert(JSON.stringify(e));
		}
	}

	toggleUser = (user) => {
		LayoutAnimation.easeInEaseOut();
		const index = this.props.users.findIndex(el => el.name === user.name);
		if (index === -1) {
			this.props.addUser(user);
		} else {
			this.props.removeUser(user);
		}
	};

	_onPressItem = (id, item = {}) => {
		if (item.search) {
			this.toggleUser({ _id: item._id, name: item.username });
		} else {
			this.toggleUser({ _id: item._id, name: item.name });
		}
	};

	_onPressSelectedItem = item => this.toggleUser(item);

	renderHeader = () => (
		<View style={styles.container}>
			{this.renderSearchBar()}
			{this.renderSelected()}
		</View>
	);

	renderSearchBar = () => (
		<View style={styles.searchBoxView}>
			<TextInput
				underlineColorAndroid='transparent'
				style={styles.searchBox}
				onChangeText={text => this.onSearchChangeText(text)}
				returnKeyType='search'
				placeholder={I18n.t('Search')}
				clearButtonMode='while-editing'
				blurOnSubmit
				testID='select-users-view-search'
				autoCorrect={false}
				autoCapitalize='none'
			/>
		</View>
	);

	renderSelected = () => {
		if (this.props.users.length === 0) {
			return null;
		}
		return (
			<FlatList
				data={this.props.users}
				keyExtractor={item => item._id}
				style={styles.list}
				renderItem={this.renderSelectedItem}
				enableEmptySections
				keyboardShouldPersistTaps='always'
				horizontal
			/>
		);
	};

	renderSelectedItem = ({ item }) => (
		<TouchableOpacity
			key={item._id}
			style={styles.selectItemView}
			onPress={() => this._onPressSelectedItem(item)}
			testID={`selected-user-${ item.name }`}
		>
			<Avatar text={item.name} size={40} />
			<Text ellipsizeMode='tail' numberOfLines={1} style={{ fontSize: 10 }}>
				{item.name}
			</Text>
		</TouchableOpacity>
	);
	renderItem = ({ item }) => (
		<RoomItem
			key={item._id}
			name={item.name}
			type={item.t}
			baseUrl={this.props.Site_Url}
			onPress={() => this._onPressItem(item._id, item)}
			id={item.rid.replace(this.props.userId, '').trim()}
			showLastMessage={false}
			avatarSize={30}
			statusStyle={styles.status}
			testID={`select-users-view-item-${ item.name }`}
		/>
	);
	renderList = () => (
		<FlatList
			data={this.state.search.length > 0 ? this.state.search : this.data}
			extraData={this.props}
			keyExtractor={item => item._id}
			style={styles.list}
			renderItem={this.renderItem}
			ListHeaderComponent={this.renderHeader}
			enableEmptySections
			keyboardShouldPersistTaps='always'
		/>
	);
	render = () => (
		<SafeAreaView style={styles.safeAreaView} testID='select-users-view'>
			{this.renderList()}
			<Loading visible={this.props.loading} />
		</SafeAreaView>
	);
}

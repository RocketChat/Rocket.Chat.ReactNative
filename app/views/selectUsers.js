import ActionButton from 'react-native-action-button';
import { ListView } from 'realm/react-native';
import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, StyleSheet, TextInput, Platform, Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as server from '../actions/connect';
import realm from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import RoomItem from '../presentation/RoomItem';
import Banner from '../containers/Banner';
import Avatar from '../containers/Avatar';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'center'
	},
	separator: {
		height: 1,
		backgroundColor: '#E7E7E7'
	},
	list: {
		width: '100%'
	},
	emptyView: {
		flexGrow: 1,
		alignItems: 'stretch',
		justifyContent: 'center'
	},
	emptyText: {
		textAlign: 'center',
		fontSize: 18,
		color: '#ccc'
	},
	actionButtonIcon: {
		fontSize: 20,
		height: 22,
		color: 'white'
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
	}
});

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
@connect(
	state => ({
		server: state.server.server,
		login: state.login,
		Site_Url: state.settings.Site_Url,
		canShowList: state.login.token || state.login.user.token
	}),
	dispatch => ({
		login: () => dispatch(actions.login()),
		connect: () => dispatch(server.connectRequest())
	})
)
export default class RoomsListView extends React.Component {
	static propTypes = {
		navigator: PropTypes.object.isRequired,
		Site_Url: PropTypes.string,
		server: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.data = realm
			.objects('subscriptions')
			.filtered('_server.id = $0 AND t = $1', this.props.server, 'd');
		this.state = {
			dataSource: ds.cloneWithRows(this.data),
			selectedUsers: [],
			selectedUsersDS: ds.cloneWithRows([
				{ _id: 1, name: 'Diego', t: 'd' },
				{ _id: 2, name: 'Diego 2', t: 'd' }
			]),
			searching: false,
			searchDataSource: [],
			searchText: '',
			login: false
		};
		this.data.addListener(this.updateState);
	}
	componentWillMount() {
		// add back button
		const button = Platform.OS === 'ios' ? 'leftButtons' : 'rightButtons';
		this.props.navigator.setButtons({
			[button]: [
				{
					id: 'back',
					title: 'Back'
				}
			],
			animated: true
		});
		// on navigator event
		this.props.navigator.setOnNavigatorEvent((event) => {
			if (event.type === 'NavBarButtonPress' && event.id === 'back') {
				this.props.navigator.dismissModal({
					animationType: 'slide-down'
				});
			}
		});
	}
	componentWillUnmount() {
		this.data.removeListener(this.updateState);
	}

	onSearchChangeText = (text) => {
		const searchText = text.trim();
		this.setState({
			searchText: text,
			searching: searchText !== ''
		});
		if (searchText === '') {
			return this.setState({
				dataSource: ds.cloneWithRows(this.data)
			});
		}

		const data = this.data.filtered('name CONTAINS[c] $0', searchText).slice();

		const usernames = [];
		const dataSource = data.map((sub) => {
			if (sub.t === 'd') {
				usernames.push(sub.name);
			}
			return sub;
		});

		if (dataSource.length < 7) {
			if (this.oldPromise) {
				this.oldPromise();
			}
			Promise.race([
				RocketChat.spotlight(searchText, usernames),
				new Promise((resolve, reject) => (this.oldPromise = reject))
			])
				.then(
					(results) => {
						results.users.forEach((user) => {
							dataSource.push({
								...user,
								name: user.username,
								t: 'd',
								search: true
							});
						});
						this.setState({
							dataSource: ds.cloneWithRows(dataSource)
						});
					},
					() => console.log('spotlight stopped')
				)
				.then(() => delete this.oldPromise);
		}

		this.setState({
			dataSource: ds.cloneWithRows(dataSource)
		});
	};

	updateState = () => {
		this.setState({
			dataSource: ds.cloneWithRows(this.data)
		});
	};

	toggleUser = (user) => {
		const selectedUsers = this.state.selectedUsers;
		const index = selectedUsers.findIndex(el => el.name === user.name);
		if (index === -1) {
			selectedUsers.push(user);
		} else {
			selectedUsers.splice(index, 1);
		}
		this.setState({ selectedUsers, selectedUsersDS: ds.cloneWithRows(selectedUsers) });
	};

	_onPressItem = (id, item = {}) => {
		if (item.search) {
			this.toggleUser({ _id: item._id, name: item.username });
		} else {
			this.toggleUser({ _id: item._id, name: item.name });
		}
	};

	_onPressSelectedItem = item => (
		this.toggleUser(item)
	);

	_createChannel = () => {
		this.props.navigator.push({
			screen: 'CreateChannel',
			title: 'Create a New Channel',
			passProps: {
				users: this.state.selectedUsers
			},
			navigatorStyle: {},
			navigatorButtons: {},
			animationType: 'slide-up'
		});
	};

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
				value={this.state.searchText}
				onChangeText={this.onSearchChangeText}
				returnKeyType='search'
				placeholder='Search'
				clearButtonMode='while-editing'
				blurOnSubmit
			/>
		</View>
	);
	renderSelected = () => {
		if (this.state.selectedUsers.length === 0) {
			return null;
		}
		return (
			<ListView
				dataSource={this.state.selectedUsersDS}
				style={styles.list}
				renderRow={this.renderSelectedItem}
				enableEmptySections
				keyboardShouldPersistTaps='always'
				horizontal
			/>
		);
	};
	renderSelectedItem = item => (
		<TouchableOpacity style={styles.selectItemView} onPress={() => this._onPressSelectedItem(item)}>
			<Avatar text={item.name} baseUrl={item.baseUrl} size={40} borderRadius={20} />
			<Text ellipsizeMode='tail' numberOfLines={1} style={{ fontSize: 10 }}>
				{item.name}
			</Text>
		</TouchableOpacity>
	);
	renderItem = item => (
		<RoomItem
			key={item._id}
			name={item.name}
			type={item.t}
			baseUrl={this.props.Site_Url}
			onPress={() => this._onPressItem(item._id, item)}
		/>
	);
	renderList = () => (
		<ListView
			dataSource={this.state.dataSource}
			style={styles.list}
			renderRow={this.renderItem}
			renderHeader={this.renderHeader}
			contentOffset={{ x: 0, y: 20 }}
			enableEmptySections
			keyboardShouldPersistTaps='always'
		/>
	);
	renderCreateButton = () => {
		if (this.state.selectedUsers.length === 0) {
			return null;
		}
		return (
			<ActionButton
				buttonColor='rgba(67, 165, 71, 1)'
				onPress={() => this._createChannel()}
				icon={<Icon name='md-arrow-forward' style={styles.actionButtonIcon} />}
			/>
		);
	};
	render = () => (
		<View style={styles.container}>
			<Banner />
			{this.renderList()}
			{this.renderCreateButton()}
		</View>
	);
}

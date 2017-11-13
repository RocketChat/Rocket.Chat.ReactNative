import ActionButton from 'react-native-action-button';
import { ListView } from 'realm/react-native';
import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, StyleSheet, TextInput, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as server from '../actions/connect';
import * as createChannelActions from '../actions/createChannel';
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
	safeAreaView: {
		backgroundColor: '#FFFFFF'
	},
	list: {
		width: '100%',
		backgroundColor: '#FFFFFF'
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
		users: state.createChannel.users
	}),
	dispatch => ({
		login: () => dispatch(actions.login()),
		connect: () => dispatch(server.connectRequest()),
		addUser: user => dispatch(createChannelActions.addUser(user)),
		removeUser: user => dispatch(createChannelActions.removeUser(user)),
		resetCreateChannel: () => dispatch(createChannelActions.reset())
	})
)
export default class RoomsListView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		Site_Url: PropTypes.string,
		server: PropTypes.string,
		addUser: PropTypes.func.isRequired,
		removeUser: PropTypes.func.isRequired,
		resetCreateChannel: PropTypes.func.isRequired,
		users: PropTypes.array
	};

	constructor(props) {
		super(props);
		this.data = realm
			.objects('subscriptions')
			.filtered('_server.id = $0 AND t = $1', this.props.server, 'd');
		this.state = {
			dataSource: ds.cloneWithRows(this.data),
			searching: false,
			searchDataSource: [],
			searchText: '',
			login: false
		};
		this.data.addListener(this.updateState);
	}

	componentWillUnmount() {
		this.data.removeListener(this.updateState);
		this.props.resetCreateChannel();
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

	_createChannel = () => {
		this.props.navigation.navigate('CreateChannel');
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
		if (this.props.users.length === 0) {
			return null;
		}
		const usersDataSource = ds.cloneWithRows(this.props.users);
		return (
			<ListView
				dataSource={usersDataSource}
				style={styles.list}
				renderRow={this.renderSelectedItem}
				enableEmptySections
				keyboardShouldPersistTaps='always'
				horizontal
			/>
		);
	};
	renderSelectedItem = item => (
		<TouchableOpacity
			key={item._id}
			style={styles.selectItemView}
			onPress={() => this._onPressSelectedItem(item)}
		>
			<Avatar text={item.name} baseUrl={this.props.Site_Url} size={40} borderRadius={20} />
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
			contentOffset={{ x: 0, y: this.props.users.length > 0 ? 40 : 20 }}
			enableEmptySections
			keyboardShouldPersistTaps='always'
		/>
	);
	renderCreateButton = () => {
		if (this.props.users.length === 0) {
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
			<SafeAreaView style={styles.safeAreaView}>
				{this.renderList()}
				{this.renderCreateButton()}
			</SafeAreaView>
		</View>
	);
}

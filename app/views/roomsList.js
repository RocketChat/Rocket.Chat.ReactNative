import ActionButton from 'react-native-action-button';
import Icon from 'react-native-vector-icons/Ionicons';
import React from 'react';
import PropTypes from 'prop-types';
import { Button, Text, View, FlatList, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import Meteor from 'react-native-meteor';
import realm from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import RoomItem from '../components/RoomItem';

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
	bannerContainer: {
		backgroundColor: '#ddd'
	},
	bannerText: {
		textAlign: 'center',
		margin: 5
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
	}
});

let navigation;
let setInitialData;

Meteor.getData().on('loggingIn', () => {
	setTimeout(() => {
		if (Meteor._isLoggingIn === false && Meteor.userId() == null) {
			console.log('loggingIn', Meteor.userId());
			navigation.navigate('Login');
		}
	}, 100);
});

Meteor.Accounts.onLogin(() => {
	console.log('onLogin');
});

export default class RoomsListView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	static navigationOptions = (props) => {
		const server = RocketChat.currentServer ? RocketChat.currentServer.replace(/^https?:\/\//, '') : '';
		const textAlign = Platform.OS === 'ios' ? 'center' : 'left';
		const marginLeft = Platform.OS === 'ios' ? 0 : 20;
		const position = Platform.OS === 'ios' ? 'headerLeft' : 'headerRight';

		return {
			headerTitle: <View style={{ height: 10, width: 200, top: -10, marginLeft }}>
				<Text style={{ textAlign, fontSize: 16, fontWeight: '600' }}>Channels</Text>
				<Text style={{ textAlign, fontSize: 10 }}>{server}</Text>
			</View>,
			title: 'Channels',
			[position]: <Button title='Servers' onPress={() => props.navigation.navigate('ListServerModal', { onSelect: setInitialData })} />
		};
	}

	constructor(props) {
		super(props);

		this.state = {
			dataSource: [],
			searching: false,
			searchDataSource: [],
			searchText: ''
		};
	}

	componentWillMount() {
		setInitialData = this.setInitialData;

		navigation = this.props.navigation;

		if (RocketChat.currentServer) {
			this.setInitialData();

			RocketChat.connect();
		} else {
			navigation.navigate('ListServerModal', {
				onSelect: this.setInitialData
			});
		}
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

		if (searchText !== '') {
			const dataSource = [];
			const usernames = [];
			realm.objects('subscriptions').filtered('_server.id = $0 AND name CONTAINS[c] $1', RocketChat.currentServer, searchText).forEach((sub) => {
				dataSource.push(sub);

				if (sub.t === 'd') {
					usernames.push(sub.name);
				}
			});

			if (dataSource.length < 5) {
				RocketChat.spotlight(searchText, usernames)
					.then((results) => {
						results.users.forEach((user) => {
							dataSource.push({
								...user,
								name: user.username,
								t: 'd',
								search: true
							});
						});

						results.rooms.forEach((room) => {
							dataSource.push({
								...room,
								search: true
							});
						});

						this.setState({
							searchDataSource: dataSource
						});
					});
			}
		}
	}

	setInitialData = () => {
		if (this.data) {
			this.data.removeListener(this.updateState);
		}

		this.data = realm.objects('subscriptions').filtered('_server.id = $0', RocketChat.currentServer).sorted('name');

		this.data.addListener(this.updateState);

		this.setState({
			dataSource: this.sort(this.data)
		});
	}

	sort = (data) => {
		return data.slice().sort((a, b) => {
			if (a.unread < b.unread) {
				return 1;
			}

			if (a.unread > b.unread) {
				return -1;
			}

			return 0;
		});
	}

	updateState = (data) => {
		this.setState({
			dataSource: this.sort(data)
		});
	}

	_onPressItem = (id, item = {}) => {
		const { navigate } = this.props.navigation;

		const clearSearch = () => {
			this.setState({
				searchText: '',
				searching: false,
				searchDataSource: []
			});
		};

		// if user is using the search we need first to join/create room
		if (item.search) {
			if (item.t === 'd') {
				RocketChat.createDirectMessage(item.username)
					.then(room => realm.objects('subscriptions').filtered('_server.id = $0 AND rid = $1', RocketChat.currentServer, room.rid))
					.then(subs => navigate('Room', { sid: subs[0]._id }))
					.then(() => clearSearch());
			} else {
				navigate('Room', { rid: item._id, name: item.name });
				clearSearch();
			}
			return;
		}

		navigate('Room', { sid: id });
		clearSearch();
	}
	_createChannel = () => {
		const { navigate } = this.props.navigation;
		navigate('CreateChannel');
	}
	renderBanner = () => {
		const status = Meteor.getData() && Meteor.getData().ddp && Meteor.getData().ddp.status;

		if (status === 'disconnected') {
			return (
				<View style={[styles.bannerContainer, { backgroundColor: '#0d0' }]}>
					<Text style={[styles.bannerText, { color: '#fff' }]}>Connecting...</Text>
				</View>
			);
		}

		if (status === 'connected' && Meteor._isLoggingIn) {
			return (
				<View style={[styles.bannerContainer, { backgroundColor: 'orange' }]}>
					<Text style={[styles.bannerText, { color: '#a00' }]}>Authenticating...</Text>
				</View>
			);
		}
	}

	renderItem = ({ item }) => (
		<TouchableOpacity onPress={() => this._onPressItem(item._id, item)}>
			<RoomItem
				id={item._id}
				item={item}
			/>
		</TouchableOpacity>
	);

	renderSeparator = () => (
		<View style={styles.separator} />
	);

	renderSearchBar = () => (
		<View style={styles.searchBoxView}>
			<TextInput
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

	renderList = () => {
		if (!this.state.searching && !this.state.dataSource.length) {
			return (
				<View style={styles.emptyView}>
					<Text style={styles.emptyText}>No rooms</Text>
				</View>
			);
		}

		return (
			<FlatList
				style={styles.list}
				data={this.state.searching ? this.state.searchDataSource : this.state.dataSource}
				renderItem={this.renderItem}
				keyExtractor={item => item._id}
				ItemSeparatorComponent={this.renderSeparator}
			/>
		);
	}
	renderCreateButtons() {
		return (
			<ActionButton buttonColor='rgba(231,76,60,1)'>
				<ActionButton.Item buttonColor='#9b59b6' title='Create Channel' onPress={() => { this._createChannel(); }} >
					<Icon name='md-chatbubbles' style={styles.actionButtonIcon} />
				</ActionButton.Item>
			</ActionButton>);
	}
	render() {
		return (
			<View style={styles.container}>
				{this.renderBanner()}
				{this.renderSearchBar()}
				{this.renderList()}
				{this.renderCreateButtons()}
			</View>
		);
	}
}

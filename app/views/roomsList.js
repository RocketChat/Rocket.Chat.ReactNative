import ActionButton from 'react-native-action-button';
import { Navigation } from 'react-native-navigation';
import { ListView } from 'realm/react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import Meteor from 'react-native-meteor';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as meteor from '../actions/connect';
import realm from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import RoomItem from '../components/RoomItem';
import Banner from '../components/banner';
// import debounce from '../utils/debounce';

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
	}
});

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
class RoomsListItem extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		onPress: PropTypes.func.isRequired,
		baseUrl: PropTypes.string
	}
	_onPress = (...args) => {
		this.props.onPress(...args);
	};

	render() {
		const { item } = this.props;
		return (
			<TouchableOpacity key={item._id} onPress={() => this.props.onPress(item._id, item)}>
				<RoomItem
					id={item._id}
					item={item}
					baseUrl={this.props.baseUrl}
				/>
			</TouchableOpacity>
		);
	}
}

@connect(state => ({
	server: state.server,
	Site_Url: state.settings.Site_Url
}), dispatch => ({
	actions: bindActionCreators(actions, dispatch),
	login: () => dispatch(actions.login()),
	connect: () => dispatch(meteor.connectRequest())
}))

export default class RoomsListView extends React.Component {
	static propTypes = {
		navigator: PropTypes.object.isRequired,
		server: PropTypes.string,
		Site_Url: PropTypes.string
	}

	constructor(props) {
		super(props);

		// this.data = realm.objects('subscriptions').filtered('_server.id = $0', this.props.server);
		this.state = {
			dataSource: ds.cloneWithRows([]),
			searching: false,
			searchDataSource: [],
			searchText: ''
		};

		this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentWillMount() {
		const button = Platform.OS === 'ios' ? 'leftButtons' : 'rightButtons';
		this.props.navigator.setButtons({
			[button]: [{
				id: 'servers',
				title: 'Servers'
			}],
			animated: true
		});

		if (this.props.server) {
			this.setInitialData();
		} else {
			Navigation.showModal({
				screen: 'ListServer',
				passProps: {},
				navigatorStyle: {},
				navigatorButtons: {},
				animationType: 'none'
			});
		}
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.server !== this.props.server) {
			this.setInitialData(nextProps);
		}
	}

	componentWillUnmount() {
		this.state.data.removeListener(this.updateState);
	}

	onNavigatorEvent = (event) => {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'servers') {
				Navigation.showModal({
					screen: 'ListServer',
					passProps: {},
					navigatorStyle: {},
					navigatorButtons: {},
					animationType: 'slide-up'
					// animationType: 'none'
				});
			}
		}
	}

	onSearchChangeText = (text) => {
		const searchText = text.trim();
		this.setState({
			searchText: text,
			searching: searchText !== ''
		});
		if (searchText === '') {
			return this.setState({
				dataSource: ds.cloneWithRows(this.state.data)
			});
		}

		const data = this.state.data.filtered('name CONTAINS[c] $0', searchText).slice();

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
				new Promise((resolve, reject) => this.oldPromise = reject)
			])
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
						dataSource: ds.cloneWithRows(dataSource)
					});
				}, () => console.log('spotlight stopped'))
				.then(() => delete this.oldPromise);
		}
		this.setState({
			dataSource: ds.cloneWithRows(dataSource)
		});
	}

	setInitialData = (props = this.props) => {
		// console.log(this.props);
		this.props.connect();
		props.navigator.setSubTitle({
			subtitle: props.server
		});
		RocketChat.getUserToken().then((token) => {
			if (!token) {
				Navigation.showModal({
					screen: 'Login',
					animationType: 'slide-up'
				});
			}


			const data = realm.objects('subscriptions').filtered('_server.id = $0', props.server).sorted('_updatedAt', true);

			this.setState({
				dataSource: ds.cloneWithRows(data),
				data
			});

			data.addListener(this.updateState);
		});
	}

	updateState = () => {
		this.setState({
			dataSource: ds.cloneWithRows(this.state.data)
		});
	};

	_onPressItem = (id, item = {}) => {
		const navigateToRoom = (room) => {
			this.props.navigator.push({
				screen: 'Room',
				passProps: room
			});
		};

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
					.then(room => new Promise((resolve) => {
						const data = realm.objects('subscriptions').filtered('_server.id = $0 AND rid = $1', this.props.server, room.rid);

						if (data.length) {
							return resolve(data[0]);
						}

						data.addListener(() => {
							if (data.length) {
								resolve(data[0]);
								data.removeAllListeners();
							}
						});
					}))
					.then(sub => navigateToRoom({ sid: sub._id }))
					.then(() => clearSearch());
			} else {
				clearSearch();
				navigateToRoom({ rid: item._id, name: item.name });
			}
			return;
		}

		navigateToRoom({ sid: id });
		clearSearch();
	}

	_createChannel = () => {
		this.props.navigator.showModal({
			screen: 'CreateChannel'
		});
	}
	renderItem = ({ item }) => (
		<RoomsListItem
			item={item}
			onPress={() => this._onPressItem(item._id, item)}
			baseUrl={this.props.Site_Url}
		/>
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

	// if (!this.state.searching && !this.state.dataSource.length) {
	// 	return (
	// 		<View style={styles.emptyView}>
	// 			<Text style={styles.emptyText}>No rooms</Text>
	// 		</View>
	// 	);
	// }
	renderList = () => (
		// data={this.state.searching ? this.state.searchDataSource : this.state.dataSource}
		// keyExtractor={item => item._id}
		// ItemSeparatorComponent={this.renderSeparator}
		// renderItem={this.renderItem}
		<ListView
			dataSource={this.state.dataSource}
			style={styles.list}
			renderRow={item => this.renderItem({ item })}
			renderHeader={this.renderSearchBar}
			contentOffset={{ x: 0, y: 20 }}
			enableEmptySections
			keyboardShouldPersistTaps='always'
		/>
	)

	renderCreateButtons() {
		return (
			<ActionButton buttonColor='rgba(231,76,60,1)'>
				<ActionButton.Item buttonColor='#9b59b6' title='Create Channel' onPress={() => { this.props.login(); }} >
					<Icon name='md-chatbubbles' style={styles.actionButtonIcon} />
				</ActionButton.Item>
			</ActionButton>);
	}
	render() {
		return (
			<View style={styles.container}>
				<Banner />
				{this.renderList()}
				{this.renderCreateButtons()}
			</View>
		);
	}
}

import ActionButton from 'react-native-action-button';
import { Navigation } from 'react-native-navigation';
import { ListView } from 'realm/react-native';
import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TextInput, Platform } from 'react-native';
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as server from '../actions/connect';
import realm from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import RoomItem from '../presentation/RoomItem';
import Banner from '../containers/Banner';

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
@connect(state => ({
	server: state.server,
	login: state.login,
	Site_Url: state.settings.Site_Url,
	canShowList: state.login.token.length || state.login.user.token
}), dispatch => ({
	login: () => dispatch(actions.login()),
	connect: () => dispatch(server.connectRequest())
}))

export default class RoomsListView extends React.Component {
	static propTypes = {
		navigator: PropTypes.object.isRequired,
		Site_Url: PropTypes.string,
		server: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.data = realm.objects('subscriptions').filtered('_server.id = $0', this.props.server);
		this.state = {
			dataSource: ds.cloneWithRows(this.data),
			searching: false,
			searchDataSource: [],
			searchText: '',
			login: false
		};
		this.data.addListener(this.updateState);
		this.props.navigator.setOnNavigatorEvent(event => event.type === 'NavBarButtonPress' && event.id === 'servers' &&
				Navigation.showModal({
					screen: 'ListServer',
					passProps: {},
					navigatorStyle: {},
					navigatorButtons: {},
					animationType: 'slide-up'
				}));
		this.props.navigator.setSubTitle({
			subtitle: this.props.server
		});
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


	updateState = () => {
		this.setState({
			dataSource: ds.cloneWithRows(this.data)
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

	renderItem = item => (
		<RoomItem
			key={item._id}
			name={item.name}
			type={item.t}
			baseUrl={this.props.Site_Url}
			onPress={() => this._onPressItem(item._id, item)}
		/>
	)
	renderList = () => (
		<ListView
			dataSource={this.state.dataSource}
			style={styles.list}
			renderRow={this.renderItem}
			renderHeader={this.renderSearchBar}
			contentOffset={{ x: 0, y: 20 }}
			enableEmptySections
			keyboardShouldPersistTaps='always'
		/>
	)
	renderCreateButtons = () => (
		<ActionButton buttonColor='rgba(231,76,60,1)' />);
	render= () => (
		<View style={styles.container}>
			<Banner />
			{this.renderList()}
			{this.renderCreateButtons()}
		</View>)
}

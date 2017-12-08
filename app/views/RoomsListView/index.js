import ActionButton from 'react-native-action-button';
import { ListView } from 'realm/react-native';
import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons';
import { Platform, View, TextInput, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import * as server from '../../actions/connect';
import realm from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import RoomItem from '../../presentation/RoomItem';
import Banner from '../../containers/Banner';
import { goRoom } from '../../containers/routes/NavigationService';
import Header from '../../containers/Header';
import RoomsListHeader from './Header';
import styles from './styles';

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
@connect(state => ({
	server: state.server.server,
	login: state.login,
	Site_Url: state.settings.Site_Url,
	canShowList: state.login.token || state.login.user.token,
	searchText: state.rooms.searchText
}), dispatch => ({
	login: () => dispatch(actions.login()),
	connect: () => dispatch(server.connectRequest())
}))

export default class RoomsListView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		Site_Url: PropTypes.string,
		server: PropTypes.string,
		searchText: PropTypes.string
	}

	static navigationOptions = ({ navigation }) => ({
		header: <Header subview={<RoomsListHeader navigation={navigation} />} />
	});

	constructor(props) {
		super(props);

		this.state = {
			dataSource: ds.cloneWithRows([]),
			searchText: ''
		};
		this.data = realm.objects('subscriptions').filtered('_server.id = $0', this.props.server).sorted('roomUpdatedAt', true);
	}

	componentDidMount() {
		this.data.addListener(this.updateState);

		this.props.navigation.setParams({
			createChannel: () => this._createChannel()
		});

		this.updateState();
	}

	componentWillReceiveProps(props) {
		if (this.props.server !== props.server) {
			this.data.removeListener(this.updateState);
			this.data = realm.objects('subscriptions').filtered('_server.id = $0', props.server).sorted('roomUpdatedAt', true);
			this.data.addListener(this.updateState);
		} else if (this.props.searchText !== props.searchText) {
			this.search(props.searchText);
		}
	}

	componentWillUnmount() {
		this.data.removeAllListeners();
	}

	onSearchChangeText(text) {
		this.setState({ searchText: text });
		this.search(text);
	}

	search(text) {
		const searchText = text.trim();
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

	_onPressItem = (item = {}) => {
		const clearSearch = () => {
			this.setState({
				searchText: ''
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
					.then(sub => goRoom({ room: sub, name: sub.name }))
					.then(() => clearSearch());
			} else {
				clearSearch();
				goRoom(item);
			}
			return;
		}

		goRoom(item);
		clearSearch();
	}

	_createChannel() {
		this.props.navigation.navigate('SelectUsers');
	}

	renderSearchBar = () => (
		<View style={styles.searchBoxView}>
			<TextInput
				underlineColorAndroid='transparent'
				style={styles.searchBox}
				value={this.state.searchText}
				onChangeText={text => this.onSearchChangeText(text)}
				returnKeyType='search'
				placeholder='Search'
				clearButtonMode='while-editing'
				blurOnSubmit
			/>
		</View>
	);

	renderItem = item => (
		<RoomItem
			alert={item.alert}
			unread={item.unread}
			userMentions={item.userMentions}
			favorite={item.f}
			name={item.name}
			_updatedAt={item.roomUpdatedAt}
			key={item._id}
			type={item.t}
			baseUrl={this.props.Site_Url}
			onPress={() => this._onPressItem(item)}
		/>
	)

	renderList = () => (
		<ListView
			dataSource={this.state.dataSource}
			style={styles.list}
			renderRow={this.renderItem}
			renderHeader={Platform.OS === 'ios' ? this.renderSearchBar : null}
			contentOffset={Platform.OS === 'ios' ? { x: 0, y: 38 } : {}}
			enableEmptySections
			keyboardShouldPersistTaps='always'
		/>
	)

	renderCreateButtons = () => (
		<ActionButton buttonColor='rgba(231,76,60,1)'>
			<ActionButton.Item buttonColor='#9b59b6' title='Create Channel' onPress={() => { this._createChannel(); }} >
				<Icon name='md-chatbubbles' style={styles.actionButtonIcon} />
			</ActionButton.Item>
		</ActionButton>
	);

	render = () => (
		<View style={styles.container}>
			<Banner />
			<SafeAreaView style={styles.safeAreaView}>
				{this.renderList()}
				{Platform.OS === 'android' && this.renderCreateButtons()}
			</SafeAreaView>
		</View>)
}

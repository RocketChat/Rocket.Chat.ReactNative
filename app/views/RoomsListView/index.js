import ActionButton from 'react-native-action-button';
import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons';
import { Platform, View, TextInput, FlatList, LayoutAnimation } from 'react-native';
import { connect } from 'react-redux';

import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import RoomItem from '../../presentation/RoomItem';
import { goRoom } from '../../containers/routes/NavigationService';
import Header from '../../containers/Header';
import RoomsListHeader from './Header';
import styles from './styles';
import throttle from '../../utils/throttle';
import LoggedView from '../View';
import log from '../../utils/log';

@connect(state => ({
	user: state.login.user,
	server: state.server.server,
	Site_Url: state.settings.Site_Url,
	searchText: state.rooms.searchText
}))
export default class RoomsListView extends LoggedView {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		user: PropTypes.object,
		Site_Url: PropTypes.string,
		server: PropTypes.string,
		searchText: PropTypes.string
	}

	static navigationOptions = ({ navigation }) => ({
		header: <Header subview={<RoomsListHeader navigation={navigation} />} />
	});

	constructor(props) {
		super('RoomsListView', props);

		this.state = {
			search: []
		};
		this._keyExtractor = this._keyExtractor.bind(this);
		this.data = database.objects('subscriptions').filtered('archived != true && open == true').sorted('roomUpdatedAt', true);
	}

	componentDidMount() {
		this.data.addListener(this.updateState);
	}

	componentWillReceiveProps(props) {
		if (this.props.server !== props.server) {
			this.data.removeListener(this.updateState);
			this.data = database.objects('subscriptions').filtered('archived != true && open == true').sorted('roomUpdatedAt', true);
			this.data.addListener(this.updateState);
		} else if (this.props.searchText !== props.searchText) {
			this.search(props.searchText);
		}
	}

	componentWillUnmount() {
		this.updateState.stop();
		this.data.removeAllListeners();
	}

	onSearchChangeText(text) {
		this.search(text);
	}

	updateState = throttle(() => {
		LayoutAnimation.easeInEaseOut();
		this.forceUpdate();
	}, 1500);

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

	_onPressItem = async(item = {}) => {
		if (!item.search) {
			return goRoom({ rid: item.rid, name: item.name });
		}
		if (item.t === 'd') {
			// if user is using the search we need first to join/create room
			try {
				const sub = await RocketChat.createDirectMessage(item.username);
				return goRoom(sub);
			} catch (e) {
				log('RoomsListView._onPressItem', e);
			}
		}
		return goRoom(item);
	}

	createChannel() {
		this.props.navigation.navigate({
			key: 'SelectedUsers',
			routeName: 'SelectedUsers',
			params: { nextAction: () => this.props.navigation.navigate('CreateChannel') }
		});
	}

	_keyExtractor(item) {
		return item.rid.replace(this.props.user.id, '').trim();
	}

	renderSearchBar = () => (
		<View style={styles.searchBoxView}>
			<TextInput
				underlineColorAndroid='transparent'
				style={styles.searchBox}
				onChangeText={text => this.onSearchChangeText(text)}
				returnKeyType='search'
				placeholder='Search'
				clearButtonMode='while-editing'
				blurOnSubmit
				autoCorrect={false}
				autoCapitalize='none'
				testID='rooms-list-view-search'
			/>
		</View>
	);

	renderItem = ({ item }) => {
		const id = item.rid.replace(this.props.user.id, '').trim();
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
		/>);
	}

	renderList = () => (
		<FlatList
			data={this.state.search.length > 0 ? this.state.search : this.data}
			keyExtractor={this._keyExtractor}
			style={styles.list}
			renderItem={this.renderItem}
			ListHeaderComponent={Platform.OS === 'ios' ? this.renderSearchBar : null}
			contentOffset={Platform.OS === 'ios' ? { x: 0, y: 38 } : {}}
			enableEmptySections
			removeClippedSubviews
			keyboardShouldPersistTaps='always'
			testID='rooms-list-view-list'
		/>
	)

	renderCreateButtons = () => (
		<ActionButton buttonColor='rgba(231,76,60,1)'>
			<ActionButton.Item buttonColor='#9b59b6' title='Create Channel' onPress={() => { this.createChannel(); }} >
				<Icon name='md-chatbubbles' style={styles.actionButtonIcon} />
			</ActionButton.Item>
		</ActionButton>
	);

	render = () => (
		<View style={styles.container} testID='rooms-list-view'>
			{this.renderList()}
			{Platform.OS === 'android' && this.renderCreateButtons()}
		</View>)
}

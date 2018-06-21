import ActionButton from 'react-native-action-button';
import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, StyleSheet, TextInput, Text, TouchableOpacity, SafeAreaView, FlatList, LayoutAnimation, Platform } from 'react-native';
import { connect } from 'react-redux';
import { Navigation } from 'react-native-navigation';

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

class SelectedUsersView extends LoggedView {
	static propTypes = {
		// navigation: PropTypes.object.isRequired,
		user: PropTypes.object,
		Site_Url: PropTypes.string,
		addUser: PropTypes.func.isRequired,
		removeUser: PropTypes.func.isRequired,
		reset: PropTypes.func.isRequired,
		users: PropTypes.array,
		loading: PropTypes.bool
	};

	static get options() {
		return {
			topBar: {
				title: {
					text: 'Select Users'
				},
				rightButtons: []
			}
		};
	}

	constructor(props) {
		super('SelectedUsersView', props);
		this.data = database.objects('subscriptions').filtered('t = $0', 'd').sorted('roomUpdatedAt', true);
		this.state = {
			search: []
		};
		this.data.addListener(this.updateState);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.users.length !== this.props.users.length) {
			Navigation.mergeOptions(this.props.componentId, {
				topBar: {
					rightButtons: [{
						id: 'SelectedUsers.createChannel',
						title: this.props.nextAction === 'CREATE_CHANNEL' ? 'Create' : 'Add',
						icon: require('../static/images/navicon_add.png') // eslint-disable-line
					}]
				}
			});
		}
	}

	componentWillUnmount() {
		this.updateState.stop();
		this.data.removeAllListeners();
		this.props.reset();
	}

	onNavigationButtonPressed = async() => {
		const { nextAction, componentId } = this.props;
		if (nextAction === 'CREATE_CHANNEL') {
			Navigation.push(componentId, {
				component: {
					name: 'CreateChannelView'
				}
			});
		} else if (nextAction === 'ADD_USER') {
			try {
				this.props.setLoadingInvite(true);
				await RocketChat.addUsersToRoom(this.props.rid);
				Navigation.pop(this.props.componentId);
				// this.props.navigation.goBack();
			} catch (e) {
				log('RoomActions Add User', e);
			} finally {
				this.props.setLoadingInvite(false);
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

	nextAction = () => {
		const params = this.props.navigation.state.params || {};
		params.nextAction();
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
			id={item.rid.replace(this.props.user.id, '').trim()}
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
	renderCreateButton = () => {
		if (this.props.users.length === 0 || Platform.OS === 'ios') {
			return null;
		}
		return (
			<ActionButton
				buttonColor='rgba(67, 165, 71, 1)'
				onPress={() => this.nextAction()}
				renderIcon={() => <Icon name='md-arrow-forward' style={styles.actionButtonIcon} />}
			/>
		);
	};
	render = () => (
		<View style={styles.container} testID='select-users-view'>
			<SafeAreaView style={styles.safeAreaView}>
				{this.renderList()}
				{/* {this.renderCreateButton()} */}
				<Loading visible={this.props.loading} />
			</SafeAreaView>
		</View>
	);
}

const mapStateToProps = state => ({
	user: state.login.user,
	Site_Url: state.settings.Site_Url,
	users: state.selectedUsers.users,
	loading: state.selectedUsers.loading
});

const mapDispatchToProps = dispatch => ({
	addUser: user => dispatch(addUser(user)),
	removeUser: user => dispatch(removeUser(user)),
	reset: () => dispatch(reset()),
	setLoadingInvite: loading => dispatch(setLoading(loading))
});

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(SelectedUsersView);

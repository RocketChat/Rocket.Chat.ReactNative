import ActionButton from 'react-native-action-button';
import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, StyleSheet, TextInput, Text, TouchableOpacity, SafeAreaView, FlatList, LayoutAnimation, Platform } from 'react-native';
import { connect } from 'react-redux';
import { addUser, removeUser, reset } from '../actions/selectedUsers';
import database from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import RoomItem from '../presentation/RoomItem';
import Avatar from '../containers/Avatar';
import Loading from '../containers/Loading';
import debounce from '../utils/debounce';
import LoggedView from './View';

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

@connect(
	state => ({
		user: state.login.user,
		Site_Url: state.settings.Site_Url,
		users: state.selectedUsers.users,
		loading: state.selectedUsers.loading
	}),
	dispatch => ({
		addUser: user => dispatch(addUser(user)),
		removeUser: user => dispatch(removeUser(user)),
		reset: () => dispatch(reset())
	})
)
export default class SelectedUsersView extends LoggedView {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		user: PropTypes.object,
		Site_Url: PropTypes.string,
		addUser: PropTypes.func.isRequired,
		removeUser: PropTypes.func.isRequired,
		reset: PropTypes.func.isRequired,
		users: PropTypes.array,
		loading: PropTypes.bool
	};

	static navigationOptions = ({ navigation }) => {
		const params = navigation.state.params || {};

		return {
			headerRight: (
				params.showCreateiOS && Platform.OS === 'ios' ?
					<TouchableOpacity
						style={{
							backgroundColor: 'transparent',
							height: 44,
							width: 44,
							alignItems: 'center',
							justifyContent: 'center'
						}}
						onPress={() => params.nextAction()}
						accessibilityLabel='Submit'
						accessibilityTraits='button'
					>
						<Icon
							name='ios-add'
							color='#292E35'
							size={24}
							backgroundColor='transparent'
						/>
					</TouchableOpacity> : null
			)
		};
	};

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
			this.props.navigation.setParams({
				showCreateiOS: nextProps.users.length > 0
			});
		}
	}

	componentWillUnmount() {
		this.updateState.stop();
		this.data.removeAllListeners();
		this.props.reset();
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
				placeholder='Search'
				clearButtonMode='while-editing'
				blurOnSubmit
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
		<View style={styles.container}>
			<SafeAreaView style={styles.safeAreaView}>
				{this.renderList()}
				{this.renderCreateButton()}
				<Loading visible={this.props.loading} />
			</SafeAreaView>
		</View>
	);
}

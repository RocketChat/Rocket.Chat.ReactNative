import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, FlatList, LayoutAnimation
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import {
	addUser as addUserAction, removeUser as removeUserAction, reset as resetAction, setLoading as setLoadingAction
} from '../actions/selectedUsers';
import database, { safeAddListener } from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import UserItem from '../presentation/UserItem';
import Loading from '../containers/Loading';
import debounce from '../utils/debounce';
import LoggedView from './View';
import I18n from '../i18n';
import log from '../utils/log';
import { isIOS } from '../utils/deviceInfo';
import SearchBox from '../containers/SearchBox';
import sharedStyles from './Styles';
import { Item, CustomHeaderButtons } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { COLOR_WHITE } from '../constants/colors';

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1,
		backgroundColor: isIOS ? '#F7F8FA' : '#E1E5E8'
	},
	header: {
		backgroundColor: COLOR_WHITE
	},
	separator: {
		marginLeft: 60
	}
});

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	users: state.selectedUsers.users,
	loading: state.selectedUsers.loading,
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	}
}), dispatch => ({
	addUser: user => dispatch(addUserAction(user)),
	removeUser: user => dispatch(removeUserAction(user)),
	reset: () => dispatch(resetAction()),
	setLoadingInvite: loading => dispatch(setLoadingAction(loading))
}))
/** @extends React.Component */
export default class SelectedUsersView extends LoggedView {
	static navigationOptions = ({ navigation }) => {
		const title = navigation.getParam('title');
		const nextAction = navigation.getParam('nextAction', () => {});
		return {
			title,
			headerRight: (
				<CustomHeaderButtons>
					<Item title={I18n.t('Next')} onPress={nextAction} testID='selected-users-view-submit' />
				</CustomHeaderButtons>
			)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		addUser: PropTypes.func.isRequired,
		removeUser: PropTypes.func.isRequired,
		reset: PropTypes.func.isRequired,
		users: PropTypes.array,
		loading: PropTypes.bool,
		setLoadingInvite: PropTypes.func,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		})
	};

	constructor(props) {
		super('SelectedUsersView', props);
		this.data = database.objects('subscriptions').filtered('t = $0', 'd').sorted('roomUpdatedAt', true);
		this.state = {
			search: []
		};
		safeAddListener(this.data, this.updateState);
	}

	componentDidMount() {
		const { navigation } = this.props;
		navigation.setParams({ nextAction: this.nextAction });
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { search } = this.state;
		const { users, loading } = this.props;
		if (nextProps.loading !== loading) {
			return true;
		}
		if (!equal(nextProps.users, users)) {
			return true;
		}
		if (!equal(nextState.search, search)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		const { reset } = this.props;
		this.updateState.stop();
		this.data.removeAllListeners();
		reset();
	}

	onSearchChangeText(text) {
		this.search(text);
	}

	nextAction = async() => {
		const { navigation, setLoadingInvite } = this.props;
		const nextActionID = navigation.getParam('nextActionID');
		if (nextActionID === 'CREATE_CHANNEL') {
			navigation.navigate('CreateChannelView');
		} else {
			const rid = navigation.getParam('rid');
			try {
				setLoadingInvite(true);
				await RocketChat.addUsersToRoom(rid);
				navigation.pop();
			} catch (e) {
				log('RoomActions Add User', e);
			} finally {
				setLoadingInvite(false);
			}
		}
	}

	// eslint-disable-next-line react/sort-comp
	updateState = debounce(() => {
		this.forceUpdate();
	}, 1000);

	search = async(text) => {
		const result = await RocketChat.search({ text, filterRooms: false });
		this.setState({
			search: result
		});
	}

	isChecked = (username) => {
		const { users } = this.props;
		return users.findIndex(el => el.name === username) !== -1;
	}

	toggleUser = (user) => {
		const { addUser, removeUser } = this.props;

		LayoutAnimation.easeInEaseOut();
		if (!this.isChecked(user.name)) {
			addUser(user);
		} else {
			removeUser(user);
		}
	}

	_onPressItem = (id, item = {}) => {
		if (item.search) {
			this.toggleUser({ _id: item._id, name: item.username, fname: item.name });
		} else {
			this.toggleUser({ _id: item._id, name: item.name, fname: item.fname });
		}
	}

	_onPressSelectedItem = item => this.toggleUser(item);

	renderHeader = () => (
		<View style={styles.header}>
			<SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='select-users-view-search' />
			{this.renderSelected()}
		</View>
	)

	renderSelected = () => {
		const { users } = this.props;

		if (users.length === 0) {
			return null;
		}
		return (
			<FlatList
				data={users}
				keyExtractor={item => item._id}
				style={[styles.list, sharedStyles.separatorTop]}
				contentContainerStyle={{ marginVertical: 5 }}
				renderItem={this.renderSelectedItem}
				enableEmptySections
				keyboardShouldPersistTaps='always'
				horizontal
			/>
		);
	}

	renderSelectedItem = ({ item }) => {
		const { baseUrl, user } = this.props;
		return (
			<UserItem
				name={item.fname}
				username={item.name}
				onPress={() => this._onPressSelectedItem(item)}
				testID={`selected-user-${ item.name }`}
				baseUrl={baseUrl}
				style={{ paddingRight: 15 }}
				user={user}
			/>
		);
	}

	renderSeparator = () => <View style={[sharedStyles.separator, styles.separator]} />

	renderItem = ({ item, index }) => {
		const { search } = this.state;
		const { baseUrl, user } = this.props;

		const name = item.search ? item.name : item.fname;
		const username = item.search ? item.username : item.name;
		let style = {};
		if (index === 0) {
			style = { ...sharedStyles.separatorTop };
		}
		if (search.length > 0 && index === search.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		if (search.length === 0 && index === this.data.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		return (
			<UserItem
				name={name}
				username={username}
				onPress={() => this._onPressItem(item._id, item)}
				testID={`select-users-view-item-${ item.name }`}
				icon={this.isChecked(username) ? 'check' : null}
				baseUrl={baseUrl}
				style={style}
				user={user}
			/>
		);
	}

	renderList = () => {
		const { search } = this.state;
		return (
			<FlatList
				data={search.length > 0 ? search : this.data}
				extraData={this.props}
				keyExtractor={item => item._id}
				renderItem={this.renderItem}
				ItemSeparatorComponent={this.renderSeparator}
				ListHeaderComponent={this.renderHeader}
				enableEmptySections
				keyboardShouldPersistTaps='always'
			/>
		);
	}

	render = () => {
		const { loading } = this.props;
		return (
			<SafeAreaView style={styles.safeAreaView} testID='select-users-view' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				{this.renderList()}
				<Loading visible={loading} />
			</SafeAreaView>
		);
	}
}

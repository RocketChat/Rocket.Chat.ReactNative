import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, FlatList } from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';
import { orderBy } from 'lodash';
import { Q } from '@nozbe/watermelondb';

import database from '../lib/database';
import RocketChat from '../lib/rocketchat';
import UserItem from '../presentation/UserItem';
import Loading from '../containers/Loading';
import I18n from '../i18n';
import log, { logEvent, events } from '../utils/log';
import SearchBox from '../containers/SearchBox';
import sharedStyles from './Styles';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { animateNextTransition } from '../utils/layoutAnimation';
import { withTheme } from '../theme';
import { getUserSelector } from '../selectors/login';
import {
	reset as resetAction,
	addUser as addUserAction,
	removeUser as removeUserAction
} from '../actions/selectedUsers';
import { showErrorAlert } from '../utils/info';
import SafeAreaView from '../containers/SafeAreaView';

const styles = StyleSheet.create({
	separator: {
		marginLeft: 60
	}
});

class SelectedUsersView extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		addUser: PropTypes.func.isRequired,
		removeUser: PropTypes.func.isRequired,
		reset: PropTypes.func.isRequired,
		users: PropTypes.array,
		loading: PropTypes.bool,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string,
			username: PropTypes.string,
			name: PropTypes.string
		}),
		navigation: PropTypes.object,
		route: PropTypes.object,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.init();

		const maxUsers = props.route.params?.maxUsers;
		this.state = {
			maxUsers,
			search: [],
			chats: []
		};
		const { user } = this.props;
		if (this.isGroupChat()) {
			props.addUser({ _id: user.id, name: user.username, fname: user.name });
		}
		this.setHeader(props.route.params?.showButton);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { search, chats } = this.state;
		const { users, loading, theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.loading !== loading) {
			return true;
		}
		if (!equal(nextProps.users, users)) {
			return true;
		}
		if (!equal(nextState.search, search)) {
			return true;
		}
		if (!equal(nextState.chats, chats)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		if (this.isGroupChat()) {
			const { users } = this.props;
			if (prevProps.users.length !== users.length) {
				this.setHeader(users.length > 0);
			}
		}
	}

	componentWillUnmount() {
		const { reset } = this.props;
		reset();
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	}

	// showButton can be sent as route params or updated by the component
	setHeader = (showButton) => {
		const { navigation, route } = this.props;
		const title = route.params?.title ?? I18n.t('Select_Users');
		const buttonText = route.params?.buttonText ?? I18n.t('Next');
		const maxUsers = route.params?.maxUsers;
		const nextAction = route.params?.nextAction ?? (() => {});
		const options = {
			title,
			headerRight: () => (
				(!maxUsers || showButton) && (
					<HeaderButton.Container>
						<HeaderButton.Item title={buttonText} onPress={nextAction} testID='selected-users-view-submit' />
					</HeaderButton.Container>
				)
			)
		};
		navigation.setOptions(options);
	}

	// eslint-disable-next-line react/sort-comp
	init = async() => {
		try {
			const db = database.active;
			const observable = await db.collections
				.get('subscriptions')
				.query(Q.where('t', 'd'))
				.observeWithColumns(['room_updated_at']);

			this.querySubscription = observable.subscribe((data) => {
				const chats = orderBy(data, ['roomUpdatedAt'], ['desc']);
				this.setState({ chats });
			});
		} catch (e) {
			log(e);
		}
	}

	onSearchChangeText(text) {
		this.search(text);
	}

	search = async(text) => {
		const result = await RocketChat.search({ text, filterRooms: false });
		this.setState({
			search: result
		});
	}

	isGroupChat = () => {
		const { maxUsers } = this.state;
		return maxUsers > 2;
	}

	isChecked = (username) => {
		const { users } = this.props;
		return users.findIndex(el => el.name === username) !== -1;
	}

	toggleUser = (user) => {
		const { maxUsers } = this.state;
		const {
			addUser, removeUser, users, user: { username }
		} = this.props;

		// Disallow removing self user from the direct message group
		if (this.isGroupChat() && username === user.name) {
			return;
		}

		animateNextTransition();
		if (!this.isChecked(user.name)) {
			if (this.isGroupChat() && users.length === maxUsers) {
				return showErrorAlert(I18n.t('Max_number_of_users_allowed_is_number', { maxUsers }), I18n.t('Oops'));
			}
			logEvent(events.SELECTED_USERS_ADD_USER);
			addUser(user);
		} else {
			logEvent(events.SELECTED_USERS_REMOVE_USER);
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

	renderHeader = () => {
		const { theme } = this.props;
		return (
			<View style={{ backgroundColor: themes[theme].backgroundColor }}>
				<SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='select-users-view-search' />
				{this.renderSelected()}
			</View>
		);
	}

	renderSelected = () => {
		const { users, theme } = this.props;

		if (users.length === 0) {
			return null;
		}
		return (
			<FlatList
				data={users}
				keyExtractor={item => item._id}
				style={[sharedStyles.separatorTop, { borderColor: themes[theme].separatorColor }]}
				contentContainerStyle={{ marginVertical: 5 }}
				renderItem={this.renderSelectedItem}
				enableEmptySections
				keyboardShouldPersistTaps='always'
				horizontal
			/>
		);
	}

	renderSelectedItem = ({ item }) => {
		const { baseUrl, user, theme } = this.props;
		return (
			<UserItem
				name={item.fname}
				username={item.name}
				onPress={() => this._onPressSelectedItem(item)}
				testID={`selected-user-${ item.name }`}
				baseUrl={baseUrl}
				style={{ paddingRight: 15 }}
				user={user}
				theme={theme}
			/>
		);
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[sharedStyles.separator, styles.separator, { backgroundColor: themes[theme].separatorColor }]} />;
	}

	renderItem = ({ item, index }) => {
		const { search, chats } = this.state;
		const { baseUrl, user, theme } = this.props;

		const name = item.search ? item.name : item.fname;
		const username = item.search ? item.username : item.name;
		let style = { borderColor: themes[theme].separatorColor };
		if (index === 0) {
			style = { ...style, ...sharedStyles.separatorTop };
		}
		if (search.length > 0 && index === search.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		if (search.length === 0 && index === chats.length - 1) {
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
				theme={theme}
			/>
		);
	}

	renderList = () => {
		const { search, chats } = this.state;
		const { theme } = this.props;

		const data = (search.length > 0 ? search : chats)
			// filter DM between multiple users
			.filter(sub => !RocketChat.isGroupChat(sub));

		return (
			<FlatList
				data={data}
				extraData={this.props}
				keyExtractor={item => item._id}
				renderItem={this.renderItem}
				ItemSeparatorComponent={this.renderSeparator}
				ListHeaderComponent={this.renderHeader}
				contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
				enableEmptySections
				keyboardShouldPersistTaps='always'
			/>
		);
	}

	render = () => {
		const { loading } = this.props;
		return (
			<SafeAreaView testID='select-users-view'>
				<StatusBar />
				{this.renderList()}
				<Loading visible={loading} />
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	users: state.selectedUsers.users,
	loading: state.selectedUsers.loading,
	user: getUserSelector(state)
});

const mapDispatchToProps = dispatch => ({
	addUser: user => dispatch(addUserAction(user)),
	removeUser: user => dispatch(removeUserAction(user)),
	reset: () => dispatch(resetAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SelectedUsersView));

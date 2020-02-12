import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, FlatList } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import { orderBy } from 'lodash';
import { Q } from '@nozbe/watermelondb';

import {
	addUser as addUserAction, removeUser as removeUserAction, reset as resetAction, setLoading as setLoadingAction
} from '../actions/selectedUsers';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';
import UserItem from '../presentation/UserItem';
import Loading from '../containers/Loading';
import debounce from '../utils/debounce';
import I18n from '../i18n';
import log from '../utils/log';
import SearchBox from '../containers/SearchBox';
import sharedStyles from './Styles';
import { Item, CustomHeaderButtons } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { animateNextTransition } from '../utils/layoutAnimation';
import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';
import { getUserSelector } from '../selectors/login';

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1
	},
	separator: {
		marginLeft: 60
	}
});

class SelectedUsersView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const title = navigation.getParam('title');
		const nextAction = navigation.getParam('nextAction', () => {});
		return {
			...themedHeader(screenProps.theme),
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
		}),
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.init();
		this.state = {
			search: [],
			chats: []
		};
	}

	componentDidMount() {
		const { navigation } = this.props;
		navigation.setParams({ nextAction: this.nextAction });
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

	componentWillUnmount() {
		const { reset } = this.props;
		reset();
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
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
				log(e);
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

		animateNextTransition();
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
		return (
			<FlatList
				data={search.length > 0 ? search : chats}
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
		const { loading, theme } = this.props;
		return (
			<SafeAreaView
				style={[styles.safeAreaView, { backgroundColor: themes[theme].auxiliaryBackground }]}
				forceInset={{ vertical: 'never' }}
				testID='select-users-view'
			>
				<StatusBar theme={theme} />
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
	reset: () => dispatch(resetAction()),
	setLoadingInvite: loading => dispatch(setLoadingAction(loading))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SelectedUsersView));

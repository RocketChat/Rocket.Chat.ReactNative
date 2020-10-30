import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, FlatList, Text
} from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';
import { orderBy } from 'lodash';
import { Q } from '@nozbe/watermelondb';

import Touch from '../utils/touch';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';
import UserItem from '../presentation/UserItem';
import sharedStyles from './Styles';
import I18n from '../i18n';
import log, { logEvent, events } from '../utils/log';
import SearchBox from '../containers/SearchBox';
import { CustomIcon } from '../lib/Icons';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import { getUserSelector } from '../selectors/login';
import Navigation from '../lib/Navigation';
import { createChannelRequest } from '../actions/createChannel';
import { goRoom } from '../utils/goRoom';
import SafeAreaView from '../containers/SafeAreaView';

const styles = StyleSheet.create({
	separator: {
		marginLeft: 60
	},
	button: {
		height: 46,
		flexDirection: 'row',
		alignItems: 'center'
	},
	buttonIcon: {
		marginLeft: 18,
		marginRight: 16
	},
	buttonText: {
		fontSize: 17,
		...sharedStyles.textRegular
	},
	buttonContainer: {
		paddingVertical: 25
	}
});

class NewMessageView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <HeaderButton.CloseModal navigation={navigation} testID='new-message-view-close' />,
		title: I18n.t('New_Message')
	})

	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		createChannel: PropTypes.func,
		maxUsers: PropTypes.number,
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool
	};

	constructor(props) {
		super(props);
		this.init();
		this.state = {
			search: [],
			chats: []
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { search, chats } = this.state;
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
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

	dismiss = () => {
		const { navigation } = this.props;
		return navigation.pop();
	}

	search = async(text) => {
		const result = await RocketChat.search({ text, filterRooms: false });
		this.setState({
			search: result
		});
	}

	createChannel = () => {
		logEvent(events.NEW_MSG_CREATE_CHANNEL);
		const { navigation } = this.props;
		navigation.navigate('SelectedUsersViewCreateChannel', { nextAction: () => navigation.navigate('CreateChannelView') });
	}

	createGroupChat = () => {
		logEvent(events.NEW_MSG_CREATE_GROUP_CHAT);
		const { createChannel, maxUsers, navigation } = this.props;
		navigation.navigate('SelectedUsersViewCreateChannel', {
			nextAction: () => createChannel({ group: true }),
			buttonText: I18n.t('Create'),
			maxUsers
		});
	}

	goRoom = (item) => {
		logEvent(events.NEW_MSG_CHAT_WITH_USER);
		const { isMasterDetail, navigation } = this.props;
		if (isMasterDetail) {
			navigation.pop();
		}
		goRoom({ item, isMasterDetail });
	}

	renderButton = ({
		onPress, testID, title, icon, first
	}) => {
		const { theme } = this.props;
		return (
			<Touch
				onPress={onPress}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				testID={testID}
				theme={theme}
			>
				<View style={[first ? sharedStyles.separatorVertical : sharedStyles.separatorBottom, styles.button, { borderColor: themes[theme].separatorColor }]}>
					<CustomIcon style={[styles.buttonIcon, { color: themes[theme].tintColor }]} size={24} name={icon} />
					<Text style={[styles.buttonText, { color: themes[theme].tintColor }]}>{title}</Text>
				</View>
			</Touch>
		);
	}

	createDiscussion = () => {
		logEvent(events.NEW_MSG_CREATE_DISCUSSION);
		Navigation.navigate('CreateDiscussionView');
	}

	renderHeader = () => {
		const { maxUsers, theme } = this.props;
		return (
			<View style={{ backgroundColor: themes[theme].auxiliaryBackground }}>
				<SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='new-message-view-search' />
				<View style={styles.buttonContainer}>
					{this.renderButton({
						onPress: this.createChannel,
						title: I18n.t('Create_Channel'),
						icon: 'channel-public',
						testID: 'new-message-view-create-channel',
						first: true
					})}
					{maxUsers > 2 ? this.renderButton({
						onPress: this.createGroupChat,
						title: I18n.t('Create_Direct_Messages'),
						icon: 'team',
						testID: 'new-message-view-create-direct-message'
					}) : null}
					{this.renderButton({
						onPress: this.createDiscussion,
						title: I18n.t('Create_Discussion'),
						icon: 'discussions',
						testID: 'new-message-view-create-discussion'
					})}
				</View>
			</View>
		);
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[sharedStyles.separator, styles.separator, { backgroundColor: themes[theme].separatorColor }]} />;
	}

	renderItem = ({ item, index }) => {
		const { search, chats } = this.state;
		const { baseUrl, user, theme } = this.props;

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
				name={item.search ? item.name : item.fname}
				username={item.search ? item.username : item.name}
				onPress={() => this.goRoom(item)}
				baseUrl={baseUrl}
				testID={`new-message-view-item-${ item.name }`}
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
				extraData={this.state}
				keyExtractor={item => item._id}
				ListHeaderComponent={this.renderHeader}
				renderItem={this.renderItem}
				ItemSeparatorComponent={this.renderSeparator}
				contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
				keyboardShouldPersistTaps='always'
			/>
		);
	}

	render() {
		return (
			<SafeAreaView testID='new-message-view'>
				<StatusBar />
				{this.renderList()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	isMasterDetail: state.app.isMasterDetail,
	baseUrl: state.server.server,
	maxUsers: state.settings.DirectMesssage_maxUsers || 1,
	user: getUserSelector(state)
});

const mapDispatchToProps = dispatch => ({
	createChannel: params => dispatch(createChannelRequest(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(NewMessageView));

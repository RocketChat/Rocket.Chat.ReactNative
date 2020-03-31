import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, FlatList, Text
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import { orderBy } from 'lodash';
import { Q } from '@nozbe/watermelondb';

import Touch from '../utils/touch';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';
import UserItem from '../presentation/UserItem';
import sharedStyles from './Styles';
import I18n from '../i18n';
import log from '../utils/log';
import SearchBox from '../containers/SearchBox';
import { CustomIcon } from '../lib/Icons';
import { CloseModalButton } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';
import { getUserSelector } from '../selectors/login';
import Navigation from '../lib/Navigation';
import { createChannelRequest } from '../actions/createChannel';

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1
	},
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
	static navigationOptions = ({ navigation, screenProps }) => ({
		...themedHeader(screenProps.theme),
		headerLeft: <CloseModalButton navigation={navigation} testID='new-message-view-close' />,
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

	onPressItem = (item) => {
		const { navigation } = this.props;
		const onPressItem = navigation.getParam('onPressItem', () => {});
		onPressItem(item);
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
		const { navigation } = this.props;
		navigation.navigate('SelectedUsersViewCreateChannel', { nextAction: () => navigation.navigate('CreateChannelView') });
	}

	createGroupChat = () => {
		const { createChannel, maxUsers, navigation } = this.props;
		navigation.navigate('SelectedUsersViewCreateChannel', {
			nextAction: () => createChannel({ group: true }),
			buttonText: I18n.t('Create'),
			maxUsers
		});
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
						icon: 'hashtag',
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
						icon: 'chat',
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
				onPress={() => this.onPressItem(item)}
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

	render = () => {
		const { theme } = this.props;
		return (
			<SafeAreaView
				style={[styles.safeAreaView, { backgroundColor: themes[theme].auxiliaryBackground }]}
				forceInset={{ vertical: 'never' }}
				testID='new-message-view'
			>
				<StatusBar theme={theme} />
				{this.renderList()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	maxUsers: state.settings.DirectMesssage_maxUsers || 1,
	user: getUserSelector(state)
});

const mapDispatchToProps = dispatch => ({
	createChannel: params => dispatch(createChannelRequest(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(NewMessageView));

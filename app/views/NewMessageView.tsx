import { Q } from '@nozbe/watermelondb';
import { StackNavigationOptions } from '@react-navigation/stack';
import { dequal } from 'dequal';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { connect } from 'react-redux';

import { createChannelRequest } from '../actions/createChannel';
import { themes } from '../constants/colors';
import * as HeaderButton from '../containers/HeaderButton';
import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';
import SearchBox from '../containers/SearchBox';
import StatusBar from '../containers/StatusBar';
import { IApplicationState, IBaseScreen, TSubscriptionModel } from '../definitions';
import I18n from '../i18n';
import database from '../lib/database';
import { CustomIcon } from '../lib/Icons';
import Navigation from '../lib/Navigation';
import RocketChat from '../lib/rocketchat';
import { compareServerVersion } from '../lib/utils';
import UserItem from '../presentation/UserItem';
import { withTheme } from '../theme';
import { goRoom } from '../utils/goRoom';
import log, { events, logEvent } from '../utils/log';
import Touch from '../utils/touch';
import sharedStyles from './Styles';

const QUERY_SIZE = 50;

const styles = StyleSheet.create({
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

interface IButton {
	onPress: () => void;
	testID: string;
	title: string;
	icon: string;
	first?: boolean;
}

interface ISearch {
	_id: string;
	status: string;
	username: string;
	avatarETag: string;
	outside: boolean;
	rid: string;
	name: string;
	t: string;
	search: boolean;
}

interface INewMessageViewState {
	search: (ISearch | TSubscriptionModel)[];
	chats: TSubscriptionModel[];
	permissions: boolean[];
}

interface INewMessageViewProps extends IBaseScreen<any, 'NewMessageView'> {
	maxUsers: number;
	isMasterDetail: boolean;
	serverVersion: string;
	createTeamPermission: string[] | undefined;
	createDirectMessagePermission: string[] | undefined;
	createPublicChannelPermission: string[] | undefined;
	createPrivateChannelPermission: string[] | undefined;
	createDiscussionPermission: string[] | undefined;
}

class NewMessageView extends React.Component<INewMessageViewProps, INewMessageViewState> {
	static navigationOptions = ({ navigation }: INewMessageViewProps): StackNavigationOptions => ({
		headerLeft: () => <HeaderButton.CloseModal navigation={navigation} testID='new-message-view-close' />,
		title: I18n.t('New_Message')
	});

	constructor(props: INewMessageViewProps) {
		super(props);
		this.init();
		this.state = {
			search: [],
			chats: [],
			permissions: []
		};
	}

	// eslint-disable-next-line react/sort-comp
	init = async () => {
		try {
			const db = database.active;
			const chats = await db
				.get('subscriptions')
				.query(Q.where('t', 'd'), Q.experimentalTake(QUERY_SIZE), Q.experimentalSortBy('room_updated_at', Q.desc))
				.fetch();

			this.setState({ chats });
		} catch (e) {
			log(e);
		}
	};

	componentDidMount() {
		this.handleHasPermission();
	}

	componentDidUpdate(prevProps: INewMessageViewProps) {
		const {
			createTeamPermission,
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createDirectMessagePermission,
			createDiscussionPermission
		} = this.props;

		if (
			!dequal(createTeamPermission, prevProps.createTeamPermission) ||
			!dequal(createPublicChannelPermission, prevProps.createPublicChannelPermission) ||
			!dequal(createPrivateChannelPermission, prevProps.createPrivateChannelPermission) ||
			!dequal(createDirectMessagePermission, prevProps.createDirectMessagePermission) ||
			!dequal(createDiscussionPermission, prevProps.createDiscussionPermission)
		) {
			this.handleHasPermission();
		}
	}

	onSearchChangeText(text: string) {
		this.search(text);
	}

	dismiss = () => {
		const { navigation } = this.props;
		return navigation.pop();
	};

	search = async (text: string) => {
		const result: ISearch[] | TSubscriptionModel[] = await RocketChat.search({ text, filterRooms: false });
		this.setState({
			search: result
		});
	};

	createChannel = () => {
		logEvent(events.NEW_MSG_CREATE_CHANNEL);
		const { navigation } = this.props;
		navigation.navigate('SelectedUsersViewCreateChannel', { nextAction: () => navigation.navigate('CreateChannelView') });
	};

	createTeam = () => {
		logEvent(events.NEW_MSG_CREATE_TEAM);
		const { navigation } = this.props;
		navigation.navigate('SelectedUsersViewCreateChannel', {
			nextAction: () => navigation.navigate('CreateChannelView', { isTeam: true })
		});
	};

	createGroupChat = () => {
		logEvent(events.NEW_MSG_CREATE_GROUP_CHAT);
		const { dispatch, maxUsers, navigation } = this.props;
		navigation.navigate('SelectedUsersViewCreateChannel', {
			nextAction: () => dispatch(createChannelRequest({ group: true })),
			buttonText: I18n.t('Create'),
			maxUsers
		});
	};

	// TODO: Refactor when migrate room
	goRoom = (item: any) => {
		logEvent(events.NEW_MSG_CHAT_WITH_USER);
		const { isMasterDetail, navigation } = this.props;
		if (isMasterDetail) {
			navigation.pop();
		}
		goRoom({ item, isMasterDetail });
	};

	renderButton = ({ onPress, testID, title, icon, first }: IButton) => {
		const { theme } = this.props;
		return (
			<Touch onPress={onPress} style={{ backgroundColor: themes[theme].backgroundColor }} testID={testID} theme={theme}>
				<View
					style={[
						first ? sharedStyles.separatorVertical : sharedStyles.separatorBottom,
						styles.button,
						{ borderColor: themes[theme].separatorColor }
					]}>
					<CustomIcon style={[styles.buttonIcon, { color: themes[theme].tintColor }]} size={24} name={icon} />
					<Text style={[styles.buttonText, { color: themes[theme].tintColor }]}>{title}</Text>
				</View>
			</Touch>
		);
	};

	createDiscussion = () => {
		logEvent(events.NEW_MSG_CREATE_DISCUSSION);
		Navigation.navigate('CreateDiscussionView');
	};

	handleHasPermission = async () => {
		const {
			createTeamPermission,
			createDirectMessagePermission,
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createDiscussionPermission
		} = this.props;
		const permissions = [
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createTeamPermission,
			createDirectMessagePermission,
			createDiscussionPermission
		];
		const permissionsToCreate = await RocketChat.hasPermission(permissions);
		this.setState({ permissions: permissionsToCreate });
	};

	renderHeader = () => {
		const { maxUsers, theme, serverVersion } = this.props;
		const { permissions } = this.state;

		return (
			<View style={{ backgroundColor: themes[theme].auxiliaryBackground }}>
				<SearchBox onChangeText={(text: string) => this.onSearchChangeText(text)} testID='new-message-view-search' />
				<View style={styles.buttonContainer}>
					{permissions[0] || permissions[1]
						? this.renderButton({
								onPress: this.createChannel,
								title: I18n.t('Create_Channel'),
								icon: 'channel-public',
								testID: 'new-message-view-create-channel',
								first: true
						  })
						: null}
					{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.13.0') && permissions[2]
						? this.renderButton({
								onPress: this.createTeam,
								title: I18n.t('Create_Team'),
								icon: 'teams',
								testID: 'new-message-view-create-team'
						  })
						: null}
					{maxUsers > 2 && permissions[3]
						? this.renderButton({
								onPress: this.createGroupChat,
								title: I18n.t('Create_Direct_Messages'),
								icon: 'message',
								testID: 'new-message-view-create-direct-message'
						  })
						: null}
					{permissions[4]
						? this.renderButton({
								onPress: this.createDiscussion,
								title: I18n.t('Create_Discussion'),
								icon: 'discussions',
								testID: 'new-message-view-create-discussion'
						  })
						: null}
				</View>
			</View>
		);
	};

	renderItem = ({ item, index }: { item: ISearch | TSubscriptionModel; index: number }) => {
		const { search, chats } = this.state;
		const { theme } = this.props;

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

		const itemSearch = item as ISearch;
		const itemModel = item as TSubscriptionModel;

		return (
			<UserItem
				name={itemSearch.search ? itemSearch.name : itemModel.fname || ''}
				username={itemSearch.search ? itemSearch.username : itemModel.name}
				onPress={() => this.goRoom(item)}
				testID={`new-message-view-item-${item.name}`}
				style={style}
				theme={theme}
			/>
		);
	};

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
				ItemSeparatorComponent={List.Separator}
				contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
				keyboardShouldPersistTaps='always'
			/>
		);
	};

	render() {
		return (
			<SafeAreaView testID='new-message-view'>
				<StatusBar />
				{this.renderList()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	serverVersion: state.server.version as string,
	isMasterDetail: state.app.isMasterDetail,
	maxUsers: (state.settings.DirectMesssage_maxUsers as number) || 1,
	createTeamPermission: state.permissions['create-team'],
	createDirectMessagePermission: state.permissions['create-d'],
	createPublicChannelPermission: state.permissions['create-c'],
	createPrivateChannelPermission: state.permissions['create-p'],
	createDiscussionPermission: state.permissions['start-discussion']
});

export default connect(mapStateToProps)(withTheme(NewMessageView));

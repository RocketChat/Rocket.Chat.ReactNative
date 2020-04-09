import React from 'react';
import PropTypes from 'prop-types';
import {
	View, SectionList, Text, Alert, Share
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import _ from 'lodash';

import Touch from '../../utils/touch';
import { setLoading as setLoadingAction } from '../../actions/selectedUsers';
import { leaveRoom as leaveRoomAction } from '../../actions/room';
import styles from './styles';
import sharedStyles from '../Styles';
import Avatar from '../../containers/Avatar';
import Status from '../../containers/Status';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { CustomIcon } from '../../lib/Icons';
import DisclosureIndicator from '../../containers/DisclosureIndicator';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import { CloseModalButton } from '../../containers/HeaderButton';
import { getUserSelector } from '../../selectors/login';
import Markdown from '../../containers/markdown';

class RoomActionsView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const options = {
			...themedHeader(screenProps.theme),
			title: I18n.t('Actions')
		};
		if (screenProps.split) {
			options.headerLeft = <CloseModalButton navigation={navigation} testID='room-actions-view-close' />;
		}
		return options;
	}

	static propTypes = {
		baseUrl: PropTypes.string,
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		leaveRoom: PropTypes.func,
		jitsiEnabled: PropTypes.bool,
		setLoadingInvite: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		const room = props.navigation.getParam('room');
		const member = props.navigation.getParam('member');
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.state = {
			room: room || { rid: this.rid, t: this.t },
			membersCount: 0,
			member: member || {},
			joined: !!room,
			canViewMembers: false,
			canAutoTranslate: false,
			canAddUser: false,
			canInviteUser: false
		};
		if (room && room.observe && room.rid) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable
				.subscribe((changes) => {
					if (this.mounted) {
						this.setState({ room: changes });
					} else {
						this.state.room = changes;
					}
				});
		}
	}

	async componentDidMount() {
		this.mounted = true;
		const { room, member } = this.state;
		if (!room.id) {
			try {
				const result = await RocketChat.getChannelInfo(room.rid);
				if (result.success) {
					this.setState({ room: { ...result.channel, rid: result.channel._id } });
				}
			} catch (e) {
				log(e);
			}
		}

		if (room && room.t !== 'd' && this.canViewMembers()) {
			try {
				const counters = await RocketChat.getRoomCounters(room.rid, room.t);
				if (counters.success) {
					this.setState({ membersCount: counters.members, joined: counters.joined });
				}
			} catch (e) {
				log(e);
			}
		} else if (room.t === 'd' && _.isEmpty(member)) {
			this.updateRoomMember();
		}

		const canAutoTranslate = await RocketChat.canAutoTranslate();
		this.setState({ canAutoTranslate });

		this.canAddUser();
		this.canInviteUser();
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	onPressTouchable = (item) => {
		if (item.route) {
			const { navigation } = this.props;
			navigation.navigate(item.route, item.params);
		}
		if (item.event) {
			return item.event();
		}
	}

	// eslint-disable-next-line react/sort-comp
	canAddUser = async() => {
		const { room, joined } = this.state;
		const { rid, t } = room;
		let canAdd = false;

		const userInRoom = joined;
		const permissions = await RocketChat.hasPermission(['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room'], rid);

		if (permissions) {
			if (userInRoom && permissions['add-user-to-joined-room']) {
				canAdd = true;
			}
			if (t === 'c' && permissions['add-user-to-any-c-room']) {
				canAdd = true;
			}
			if (t === 'p' && permissions['add-user-to-any-p-room']) {
				canAdd = true;
			}
		}
		this.setState({ canAddUser: canAdd });
	}

	canInviteUser = async() => {
		const { room } = this.state;
		const { rid } = room;
		const permissions = await RocketChat.hasPermission(['create-invite-links'], rid);

		const canInviteUser = permissions && permissions['create-invite-links'];
		this.setState({ canInviteUser });
	}

	canViewMembers = async() => {
		const { room } = this.state;
		const { rid, t, broadcast } = room;
		if (broadcast) {
			const viewBroadcastMemberListPermission = 'view-broadcast-member-list';
			const permissions = await RocketChat.hasPermission([viewBroadcastMemberListPermission], rid);
			if (!permissions[viewBroadcastMemberListPermission]) {
				return false;
			}
		}

		// This method is executed only in componentDidMount and returns a value
		// We save the state to read in render
		const result = (t === 'c' || t === 'p');
		this.setState({ canViewMembers: result });
		return result;
	}

	get sections() {
		const {
			room, member, membersCount, canViewMembers, canAddUser, canInviteUser, joined, canAutoTranslate
		} = this.state;
		const { jitsiEnabled } = this.props;
		const {
			rid, t, blocker
		} = room;
		const isGroupChat = RocketChat.isGroupChat(room);

		const notificationsAction = {
			icon: 'bell',
			name: I18n.t('Notifications'),
			route: 'NotificationPrefView',
			params: { rid, room },
			testID: 'room-actions-notifications'
		};

		const jitsiActions = jitsiEnabled ? [
			{
				icon: 'livechat',
				name: I18n.t('Voice_call'),
				event: () => RocketChat.callJitsi(rid, true),
				testID: 'room-actions-voice'
			},
			{
				icon: 'video',
				name: I18n.t('Video_call'),
				event: () => RocketChat.callJitsi(rid),
				testID: 'room-actions-video'
			}
		] : [];

		const sections = [{
			data: [{
				icon: 'star',
				name: I18n.t('Room_Info'),
				route: 'RoomInfoView',
				// forward room only if room isn't joined
				params: {
					rid, t, room, member
				},
				disabled: isGroupChat,
				testID: 'room-actions-info'
			}],
			renderItem: this.renderRoomInfo
		}, {
			data: jitsiActions,
			renderItem: this.renderItem
		}, {
			data: [
				{
					icon: 'file-generic',
					name: I18n.t('Files'),
					route: 'MessagesView',
					params: { rid, t, name: 'Files' },
					testID: 'room-actions-files'
				},
				{
					icon: 'at',
					name: I18n.t('Mentions'),
					route: 'MessagesView',
					params: { rid, t, name: 'Mentions' },
					testID: 'room-actions-mentioned'
				},
				{
					icon: 'star',
					name: I18n.t('Starred'),
					route: 'MessagesView',
					params: { rid, t, name: 'Starred' },
					testID: 'room-actions-starred'
				},
				{
					icon: 'magnifier',
					name: I18n.t('Search'),
					route: 'SearchMessagesView',
					params: { rid },
					testID: 'room-actions-search'
				},
				{
					icon: 'share',
					name: I18n.t('Share'),
					event: this.handleShare,
					testID: 'room-actions-share'
				},
				{
					icon: 'pin',
					name: I18n.t('Pinned'),
					route: 'MessagesView',
					params: { rid, t, name: 'Pinned' },
					testID: 'room-actions-pinned'
				}
			],
			renderItem: this.renderItem
		}];

		if (canAutoTranslate) {
			sections[2].data.push({
				icon: 'language',
				name: I18n.t('Auto_Translate'),
				route: 'AutoTranslateView',
				params: { rid, room },
				testID: 'room-actions-auto-translate'
			});
		}

		if (isGroupChat) {
			sections[2].data.unshift({
				icon: 'team',
				name: I18n.t('Members'),
				description: membersCount > 0 ? `${ membersCount } ${ I18n.t('members') }` : null,
				route: 'RoomMembersView',
				params: { rid, room },
				testID: 'room-actions-members'
			});
		}

		if (t === 'd' && !isGroupChat) {
			sections.push({
				data: [
					{
						icon: 'ban',
						name: I18n.t(`${ blocker ? 'Unblock' : 'Block' }_user`),
						type: 'danger',
						event: this.toggleBlockUser,
						testID: 'room-actions-block-user'
					}
				],
				renderItem: this.renderItem
			});
			sections[2].data.push(notificationsAction);
		} else if (t === 'c' || t === 'p') {
			const actions = [];

			if (canViewMembers) {
				actions.push({
					icon: 'team',
					name: I18n.t('Members'),
					description: membersCount > 0 ? `${ membersCount } ${ I18n.t('members') }` : null,
					route: 'RoomMembersView',
					params: { rid, room },
					testID: 'room-actions-members'
				});
			}

			if (canAddUser) {
				actions.push({
					icon: 'plus',
					name: I18n.t('Add_users'),
					route: 'SelectedUsersView',
					params: {
						rid,
						title: I18n.t('Add_users'),
						nextAction: this.addUser
					},
					testID: 'room-actions-add-user'
				});
			}
			if (canInviteUser) {
				actions.push({
					icon: 'user-plus',
					name: I18n.t('Invite_users'),
					route: 'InviteUsersView',
					params: {
						rid
					},
					testID: 'room-actions-invite-user'
				});
			}
			sections[2].data = [...actions, ...sections[2].data];

			if (joined) {
				sections[2].data.push(notificationsAction);
				sections.push({
					data: [
						{
							icon: 'sign-out',
							name: I18n.t('Leave_channel'),
							type: 'danger',
							event: this.leaveChannel,
							testID: 'room-actions-leave-channel'
						}
					],
					renderItem: this.renderItem
				});
			}
		} else if (t === 'l') {
			sections[2].data = [notificationsAction];
		}

		return sections;
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[styles.separator, { backgroundColor: themes[theme].separatorColor }]} />;
	}

	updateRoomMember = async() => {
		const { room } = this.state;

		try {
			if (!RocketChat.isGroupChat(room)) {
				const roomUserId = RocketChat.getUidDirectMessage(room);
				const result = await RocketChat.getUserInfo(roomUserId);
				if (result.success) {
					this.setState({ member: result.user });
				}
			}
		} catch (e) {
			log(e);
			this.setState({ member: {} });
		}
	}

	addUser = async() => {
		const { room } = this.state;
		const { setLoadingInvite, navigation } = this.props;
		const { rid } = room;
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

	toggleBlockUser = () => {
		const { room } = this.state;
		const { rid, blocker } = room;
		const { member } = this.state;
		try {
			RocketChat.toggleBlockUser(rid, member._id, !blocker);
		} catch (e) {
			log(e);
		}
	}

	handleShare = () => {
		const { room } = this.state;
		const permalink = RocketChat.getPermalinkChannel(room);
		if (!permalink) {
			return;
		}
		Share.share({
			message: permalink
		});
	};

	leaveChannel = () => {
		const { room } = this.state;
		const { leaveRoom } = this.props;

		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Are_you_sure_you_want_to_leave_the_room', { room: room.t === 'd' ? room.fname : room.name }),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('leave') }),
					style: 'destructive',
					onPress: () => leaveRoom(room.rid, room.t)
				}
			]
		);
	}

	renderRoomInfo = ({ item }) => {
		const { room, member } = this.state;
		const { name, t, topic } = room;
		const { baseUrl, user, theme } = this.props;

		const avatar = RocketChat.getRoomAvatar(room);

		return (
			this.renderTouchableItem((
				<>
					<Avatar
						text={avatar}
						size={50}
						style={styles.avatar}
						type={t}
						baseUrl={baseUrl}
						userId={user.id}
						token={user.token}
					>
						{t === 'd' && member._id ? <Status style={sharedStyles.status} id={member._id} /> : null }
					</Avatar>
					<View style={styles.roomTitleContainer}>
						{room.t === 'd'
							? <Text style={[styles.roomTitle, { color: themes[theme].titleText }]} numberOfLines={1}>{room.fname}</Text>
							: (
								<View style={styles.roomTitleRow}>
									<RoomTypeIcon type={room.prid ? 'discussion' : room.t} theme={theme} />
									<Text style={[styles.roomTitle, { color: themes[theme].titleText }]} numberOfLines={1}>{room.prid ? room.fname : room.name}</Text>
								</View>
							)
						}
						<Markdown
							preview
							msg={t === 'd' ? `@${ name }` : topic}
							style={[styles.roomDescription, { color: themes[theme].auxiliaryText }]}
							numberOfLines={1}
							theme={theme}
						/>
						{room.t === 'd' && <Markdown msg={member.statusText} style={[styles.roomDescription, { color: themes[theme].auxiliaryText }]} preview theme={theme} />}
					</View>
					{!item.disabled && <DisclosureIndicator theme={theme} />}
				</>
			), item)
		);
	}

	renderTouchableItem = (subview, item) => {
		const { theme } = this.props;
		return (
			<Touch
				onPress={() => this.onPressTouchable(item)}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				accessibilityLabel={item.name}
				accessibilityTraits='button'
				enabled={!item.disabled}
				testID={item.testID}
				theme={theme}
			>
				<View style={styles.sectionItem}>
					{subview}
				</View>
			</Touch>
		);
	}

	renderItem = ({ item }) => {
		const { theme } = this.props;
		const colorDanger = { color: themes[theme].dangerColor };
		const subview = item.type === 'danger' ? (
			<>
				<CustomIcon name={item.icon} size={24} style={[styles.sectionItemIcon, colorDanger]} />
				<Text style={[styles.sectionItemName, colorDanger]}>{ item.name }</Text>
			</>
		) : (
			<>
				<CustomIcon name={item.icon} size={24} style={[styles.sectionItemIcon, { color: themes[theme].bodyText }]} />
				<Text style={[styles.sectionItemName, { color: themes[theme].bodyText }]}>{ item.name }</Text>
				{item.description ? <Text style={[styles.sectionItemDescription, { color: themes[theme].auxiliaryText }]}>{ item.description }</Text> : null}
				<DisclosureIndicator theme={theme} />
			</>
		);
		return this.renderTouchableItem(subview, item);
	}

	renderSectionSeparator = (data) => {
		const { theme } = this.props;
		if (data.trailingItem) {
			return <View style={[styles.sectionSeparator, data.leadingSection && styles.sectionSeparatorBorder, { backgroundColor: themes[theme].auxiliaryBackground, borderColor: themes[theme].separatorColor }]} />;
		}
		if (!data.trailingSection) {
			return <View style={[styles.sectionSeparatorBorder, { backgroundColor: themes[theme].auxiliaryBackground, borderColor: themes[theme].separatorColor }]} />;
		}
		return null;
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView style={styles.container} testID='room-actions-view' forceInset={{ vertical: 'never' }}>
				<StatusBar theme={theme} />
				<SectionList
					contentContainerStyle={[styles.contentContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}
					style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
					stickySectionHeadersEnabled={false}
					sections={this.sections}
					SectionSeparatorComponent={this.renderSectionSeparator}
					ItemSeparatorComponent={this.renderSeparator}
					keyExtractor={item => item.name}
					testID='room-actions-list'
					{...scrollPersistTaps}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	baseUrl: state.server.server,
	jitsiEnabled: state.settings.Jitsi_Enabled || false
});

const mapDispatchToProps = dispatch => ({
	leaveRoom: (rid, t) => dispatch(leaveRoomAction(rid, t)),
	setLoadingInvite: loading => dispatch(setLoadingAction(loading))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(RoomActionsView));

import React from 'react';
import PropTypes from 'prop-types';
import {
	View, SectionList, Text, Alert, Share, Switch
} from 'react-native';
import { connect } from 'react-redux';
import _ from 'lodash';

import Touch from '../../utils/touch';
import { setLoading as setLoadingAction } from '../../actions/selectedUsers';
import { leaveRoom as leaveRoomAction, closeRoom as closeRoomAction } from '../../actions/room';
import styles from './styles';
import sharedStyles from '../Styles';
import Avatar from '../../containers/Avatar';
import Status from '../../containers/Status';
import RocketChat from '../../lib/rocketchat';
import log, { logEvent, events } from '../../utils/log';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { CustomIcon } from '../../lib/Icons';
import DisclosureIndicator from '../../containers/DisclosureIndicator';
import StatusBar from '../../containers/StatusBar';
import { themes, SWITCH_TRACK_COLOR } from '../../constants/colors';
import { withTheme } from '../../theme';
import { CloseModalButton } from '../../containers/HeaderButton';
import { getUserSelector } from '../../selectors/login';
import Markdown from '../../containers/markdown';
import { showConfirmationAlert, showErrorAlert } from '../../utils/info';
import SafeAreaView from '../../containers/SafeAreaView';
import { E2E_ROOM_TYPES } from '../../lib/encryption/constants';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import database from '../../lib/database';

class RoomActionsView extends React.Component {
	static navigationOptions = ({ navigation, isMasterDetail }) => {
		const options = {
			title: I18n.t('Actions')
		};
		if (isMasterDetail) {
			options.headerLeft = () => <CloseModalButton navigation={navigation} testID='room-actions-view-close' />;
		}
		return options;
	}

	static propTypes = {
		baseUrl: PropTypes.string,
		navigation: PropTypes.object,
		route: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		leaveRoom: PropTypes.func,
		jitsiEnabled: PropTypes.bool,
		e2eEnabled: PropTypes.bool,
		setLoadingInvite: PropTypes.func,
		closeRoom: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		const room = props.route.params?.room;
		const member = props.route.params?.member;
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.state = {
			room: room || { rid: this.rid, t: this.t },
			membersCount: 0,
			member: member || {},
			joined: !!room,
			canViewMembers: false,
			canAutoTranslate: false,
			canAddUser: false,
			canInviteUser: false,
			canForwardGuest: false,
			canReturnQueue: false,
			canEdit: false
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
		if (room.rid) {
			if (!room.id && !this.isOmnichannelPreview) {
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
			this.canEdit();

			// livechat permissions
			if (room.t === 'l') {
				this.canForwardGuest();
				this.canReturnQueue();
			}
		}
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	get isOmnichannelPreview() {
		const { room } = this.state;
		return room.t === 'l' && room.status === 'queued';
	}

	onPressTouchable = (item) => {
		const { route, event, params } = item;
		if (route) {
			logEvent(events[`RA_GO_${ route.replace('View', '').toUpperCase() }${ params.name ? params.name.toUpperCase() : '' }`]);
			const { navigation } = this.props;
			navigation.navigate(route, params);
		}
		if (event) {
			return event();
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

	canEdit = async() => {
		const { room } = this.state;
		const { rid } = room;
		const permissions = await RocketChat.hasPermission(['edit-room'], rid);

		const canEdit = permissions && permissions['edit-room'];
		this.setState({ canEdit });
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

	canForwardGuest = async() => {
		const { room } = this.state;
		const { rid } = room;
		let result = true;

		const transferLivechatGuest = 'transfer-livechat-guest';
		const permissions = await RocketChat.hasPermission([transferLivechatGuest], rid);
		if (!permissions[transferLivechatGuest]) {
			result = false;
		}

		this.setState({ canForwardGuest: result });
	}

	canReturnQueue = async() => {
		try {
			const { returnQueue } = await RocketChat.getRoutingConfig();
			this.setState({ canReturnQueue: returnQueue });
		} catch {
			// do nothing
		}
	}

	get sections() {
		const {
			room, member, membersCount, canViewMembers, canAddUser, canInviteUser, joined, canAutoTranslate, canForwardGuest, canReturnQueue, canEdit
		} = this.state;
		const { jitsiEnabled, e2eEnabled } = this.props;
		const {
			rid, t, blocker, encrypted
		} = room;
		const isGroupChat = RocketChat.isGroupChat(room);

		const notificationsAction = {
			icon: 'notification',
			name: I18n.t('Notifications'),
			route: 'NotificationPrefView',
			params: { rid, room },
			testID: 'room-actions-notifications',
			right: this.renderDisclosure
		};

		const jitsiActions = jitsiEnabled ? [
			{
				icon: 'phone',
				name: I18n.t('Voice_call'),
				event: () => RocketChat.callJitsi(rid, true),
				testID: 'room-actions-voice',
				right: this.renderDisclosure
			},
			{
				icon: 'camera',
				name: I18n.t('Video_call'),
				event: () => RocketChat.callJitsi(rid),
				testID: 'room-actions-video',
				right: this.renderDisclosure
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
					icon: 'attach',
					name: I18n.t('Files'),
					route: 'MessagesView',
					params: { rid, t, name: 'Files' },
					testID: 'room-actions-files',
					right: this.renderDisclosure
				},
				{
					icon: 'mention',
					name: I18n.t('Mentions'),
					route: 'MessagesView',
					params: { rid, t, name: 'Mentions' },
					testID: 'room-actions-mentioned',
					right: this.renderDisclosure
				},
				{
					icon: 'star',
					name: I18n.t('Starred'),
					route: 'MessagesView',
					params: { rid, t, name: 'Starred' },
					testID: 'room-actions-starred',
					right: this.renderDisclosure
				},
				{
					icon: 'search',
					name: I18n.t('Search'),
					route: 'SearchMessagesView',
					params: { rid, encrypted },
					testID: 'room-actions-search',
					right: this.renderDisclosure
				},
				{
					icon: 'share',
					name: I18n.t('Share'),
					event: this.handleShare,
					testID: 'room-actions-share',
					right: this.renderDisclosure
				},
				{
					icon: 'pin',
					name: I18n.t('Pinned'),
					route: 'MessagesView',
					params: { rid, t, name: 'Pinned' },
					testID: 'room-actions-pinned',
					right: this.renderDisclosure
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
				testID: 'room-actions-auto-translate',
				right: this.renderDisclosure
			});
		}

		if (isGroupChat) {
			sections[2].data.unshift({
				icon: 'team',
				name: I18n.t('Members'),
				description: membersCount > 0 ? `${ membersCount } ${ I18n.t('members') }` : null,
				route: 'RoomMembersView',
				params: { rid, room },
				testID: 'room-actions-members',
				right: this.renderDisclosure
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
						testID: 'room-actions-block-user',
						right: this.renderDisclosure
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
					testID: 'room-actions-members',
					right: this.renderDisclosure
				});
			}

			if (canAddUser) {
				actions.push({
					icon: 'add',
					name: I18n.t('Add_users'),
					route: 'SelectedUsersView',
					params: {
						rid,
						title: I18n.t('Add_users'),
						nextAction: this.addUser
					},
					testID: 'room-actions-add-user',
					right: this.renderDisclosure
				});
			}
			if (canInviteUser) {
				actions.push({
					icon: 'user-add',
					name: I18n.t('Invite_users'),
					route: 'InviteUsersView',
					params: {
						rid
					},
					testID: 'room-actions-invite-user',
					right: this.renderDisclosure
				});
			}
			sections[2].data = [...actions, ...sections[2].data];

			if (joined) {
				sections[2].data.push(notificationsAction);
				sections.push({
					data: [
						{
							icon: 'logout',
							name: I18n.t('Leave_channel'),
							type: 'danger',
							event: this.leaveChannel,
							testID: 'room-actions-leave-channel',
							right: this.renderDisclosure
						}
					],
					renderItem: this.renderItem
				});
			}
		} else if (t === 'l') {
			sections[2].data = [];

			if (!this.isOmnichannelPreview) {
				sections[2].data.push({
					icon: 'close',
					name: I18n.t('Close'),
					event: this.closeLivechat,
					right: this.renderDisclosure
				});

				if (canForwardGuest) {
					sections[2].data.push({
						icon: 'user-forward',
						name: I18n.t('Forward'),
						route: 'ForwardLivechatView',
						params: { rid },
						right: this.renderDisclosure
					});
				}

				if (canReturnQueue) {
					sections[2].data.push({
						icon: 'undo',
						name: I18n.t('Return'),
						event: this.returnLivechat,
						right: this.renderDisclosure
					});
				}

				sections[2].data.push({
					icon: 'history',
					name: I18n.t('Navigation_history'),
					route: 'VisitorNavigationView',
					params: { rid },
					right: this.renderDisclosure
				});
			}

			sections.push({
				data: [notificationsAction],
				renderItem: this.renderItem
			});
		}

		// If can edit this room
		// If this room type can be Encrypted
		// If e2e is enabled for this server
		if (canEdit && E2E_ROOM_TYPES[t] && e2eEnabled) {
			sections.splice(2, 0, {
				data: [{
					icon: 'encrypted',
					name: I18n.t('Encrypted'),
					testID: 'room-actions-encrypt',
					right: this.renderEncryptedSwitch
				}],
				renderItem: this.renderItem
			});
		}

		return sections;
	}

	renderDisclosure = () => {
		const { theme } = this.props;
		return <DisclosureIndicator theme={theme} />;
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[styles.separator, { backgroundColor: themes[theme].separatorColor }]} />;
	}

	renderEncryptedSwitch = () => {
		const { room } = this.state;
		const { encrypted } = room;
		return (
			<Switch
				value={encrypted}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleEncrypted}
				style={styles.encryptedSwitch}
			/>
		);
	}

	closeLivechat = () => {
		const { room: { rid } } = this.state;
		const { closeRoom } = this.props;

		closeRoom(rid);
	}

	returnLivechat = () => {
		const { room: { rid } } = this.state;
		showConfirmationAlert({
			message: I18n.t('Would_you_like_to_return_the_inquiry'),
			confirmationText: I18n.t('Yes'),
			onPress: async() => {
				try {
					await RocketChat.returnLivechat(rid);
				} catch (e) {
					showErrorAlert(e.reason, I18n.t('Oops'));
				}
			}
		});
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

	toggleBlockUser = async() => {
		logEvent(events.RA_TOGGLE_BLOCK_USER);
		const { room } = this.state;
		const { rid, blocker } = room;
		const { member } = this.state;
		try {
			await RocketChat.toggleBlockUser(rid, member._id, !blocker);
		} catch (e) {
			logEvent(events.RA_TOGGLE_BLOCK_USER_F);
			log(e);
		}
	}

	toggleEncrypted = async() => {
		logEvent(events.RA_TOGGLE_ENCRYPTED);
		const { room } = this.state;
		const { rid } = room;
		const db = database.active;

		// Toggle encrypted value
		const encrypted = !room.encrypted;
		try {
			// Instantly feedback to the user
			await db.action(async() => {
				await room.update(protectedFunction((r) => {
					r.encrypted = encrypted;
				}));
			});

			try {
				// Send new room setting value to server
				const { result } = await RocketChat.saveRoomSettings(rid, { encrypted });
				// If it was saved successfully
				if (result) {
					return;
				}
			} catch {
				// do nothing
			}

			// If something goes wrong we go back to the previous value
			await db.action(async() => {
				await room.update(protectedFunction((r) => {
					r.encrypted = room.encrypted;
				}));
			});
		} catch (e) {
			logEvent(events.RA_TOGGLE_ENCRYPTED_F);
			log(e);
		}
	}

	handleShare = () => {
		logEvent(events.RA_SHARE);
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
			I18n.t('Are_you_sure_you_want_to_leave_the_room', { room: RocketChat.getRoomTitle(room) }),
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
		const { theme } = this.props;

		const avatar = RocketChat.getRoomAvatar(room);

		return (
			this.renderTouchableItem((
				<>
					<Avatar
						text={avatar}
						style={styles.avatar}
						size={50}
						type={t}
					>
						{t === 'd' && member._id ? <Status style={sharedStyles.status} id={member._id} /> : null }
					</Avatar>
					<View style={[styles.roomTitleContainer, item.disabled && styles.roomTitlePadding]}>
						{room.t === 'd'
							? <Text style={[styles.roomTitle, { color: themes[theme].titleText }]} numberOfLines={1}>{room.fname}</Text>
							: (
								<View style={styles.roomTitleRow}>
									<RoomTypeIcon type={room.prid ? 'discussion' : room.t} status={room.visitor?.status} theme={theme} />
									<Text style={[styles.roomTitle, { color: themes[theme].titleText }]} numberOfLines={1}>{RocketChat.getRoomTitle(room)}</Text>
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
						{room.t === 'd' && <Markdown msg={member.statusText} style={[styles.roomDescription, { color: themes[theme].auxiliaryText }]} preview theme={theme} numberOfLines={1} />}
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
				{item?.right?.()}
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
			<SafeAreaView testID='room-actions-view' theme={theme}>
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
	jitsiEnabled: state.settings.Jitsi_Enabled || false,
	e2eEnabled: state.settings.E2E_Enable || false
});

const mapDispatchToProps = dispatch => ({
	leaveRoom: (rid, t) => dispatch(leaveRoomAction(rid, t)),
	closeRoom: rid => dispatch(closeRoomAction(rid)),
	setLoadingInvite: loading => dispatch(setLoadingAction(loading))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(RoomActionsView));

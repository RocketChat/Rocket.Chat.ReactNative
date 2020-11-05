import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, Alert, Share, Switch
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
import * as List from '../../containers/List';
import RocketChat from '../../lib/rocketchat';
import log, { logEvent, events } from '../../utils/log';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { themes, SWITCH_TRACK_COLOR } from '../../constants/colors';
import { withTheme } from '../../theme';
import * as HeaderButton from '../../containers/HeaderButton';
import Markdown from '../../containers/markdown';
import { showConfirmationAlert, showErrorAlert } from '../../utils/info';
import SafeAreaView from '../../containers/SafeAreaView';
import { E2E_ROOM_TYPES } from '../../lib/encryption/constants';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import database from '../../lib/database';
import { withDimensions } from '../../dimensions';

class RoomActionsView extends React.Component {
	static navigationOptions = ({ navigation, isMasterDetail }) => {
		const options = {
			title: I18n.t('Actions')
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='room-actions-view-close' />;
		}
		return options;
	}

	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		leaveRoom: PropTypes.func,
		jitsiEnabled: PropTypes.bool,
		e2eEnabled: PropTypes.bool,
		setLoadingInvite: PropTypes.func,
		closeRoom: PropTypes.func,
		theme: PropTypes.string,
		fontScale: PropTypes.number
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

	renderEncryptedSwitch = () => {
		const { room } = this.state;
		const { encrypted } = room;
		return (
			<Switch
				value={encrypted}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleEncrypted}
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

	renderRoomInfo = () => {
		const { room, member } = this.state;
		const {
			rid, name, t, topic
		} = room;
		const { theme, fontScale } = this.props;

		const avatar = RocketChat.getRoomAvatar(room);
		const isGroupChat = RocketChat.isGroupChat(room);

		return (
			<List.Section>
				<List.Separator />
				<Touch
					onPress={() => this.onPressTouchable({
						route: 'RoomInfoView',
						// forward room only if room isn't joined
						params: {
							rid, t, room, member
						}
					})}
					style={{ backgroundColor: themes[theme].backgroundColor }}
					accessibilityLabel={I18n.t('Room_Info')}
					accessibilityTraits='button'
					enabled={!isGroupChat}
					testID='room-actions-info'
					theme={theme}
				>
					<View style={[styles.roomInfoContainer, { height: 72 * fontScale }]}>
						<Avatar
							text={avatar}
							style={styles.avatar}
							size={50 * fontScale}
							type={t}
							rid={rid}
						>
							{t === 'd' && member._id ? <Status style={sharedStyles.status} id={member._id} /> : null }
						</Avatar>
						<View style={styles.roomTitleContainer}>
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
						{isGroupChat ? null : <List.Icon name='chevron-right' />}
					</View>
				</Touch>
				<List.Separator />
			</List.Section>
		);
	}

	renderJitsi = () => {
		const { room } = this.state;
		const { jitsiEnabled } = this.props;
		if (!jitsiEnabled) {
			return null;
		}
		return (
			<List.Section>
				<List.Separator />
				<List.Item
					title='Voice_call'
					onPress={() => RocketChat.callJitsi(room?.rid, true)}
					testID='room-actions-voice'
					left={() => <List.Icon name='phone' />}
					showActionIndicator
				/>
				<List.Separator />
				<List.Item
					title='Video_call'
					onPress={() => RocketChat.callJitsi(room?.rid)}
					testID='room-actions-video'
					left={() => <List.Icon name='camera' />}
					showActionIndicator
				/>
				<List.Separator />
			</List.Section>
		);
	}

	renderE2EEncryption = () => {
		const {
			room, canEdit
		} = this.state;
		const { e2eEnabled } = this.props;

		// If can edit this room
		// If this room type can be Encrypted
		// If e2e is enabled for this server
		if (canEdit && E2E_ROOM_TYPES[room?.t] && e2eEnabled) {
			return (
				<List.Section>
					<List.Separator />
					<List.Item
						title='Encrypted'
						testID='room-actions-encrypt'
						left={() => <List.Icon name='encrypted' />}
						right={this.renderEncryptedSwitch}
					/>
					<List.Separator />
				</List.Section>
			);
		}
		return null;
	}

	renderLastSection = () => {
		const { room, joined } = this.state;
		const { theme } = this.props;
		const { t, blocker } = room;

		if (!joined || t === 'l') {
			return null;
		}

		if (t === 'd') {
			return (
				<List.Section>
					<List.Separator />
					<List.Item
						title={`${ blocker ? 'Unblock' : 'Block' }_user`}
						onPress={() => this.onPressTouchable({
							event: this.toggleBlockUser
						})}
						testID='room-actions-block-user'
						left={() => <List.Icon name='ban' color={themes[theme].dangerColor} />}
						showActionIndicator
						color={themes[theme].dangerColor}
					/>
					<List.Separator />
				</List.Section>
			);
		}

		if (t === 'p' || t === 'c') {
			return (
				<List.Section>
					<List.Separator />
					<List.Item
						title='Leave_channel'
						onPress={() => this.onPressTouchable({
							event: this.leaveChannel
						})}
						testID='room-actions-leave-channel'
						left={() => <List.Icon name='logout' color={themes[theme].dangerColor} />}
						showActionIndicator
						color={themes[theme].dangerColor}
					/>
					<List.Separator />
				</List.Section>
			);
		}
	}

	render() {
		const {
			room, membersCount, canViewMembers, canAddUser, canInviteUser, joined, canAutoTranslate, canForwardGuest, canReturnQueue
		} = this.state;
		const {
			rid, t, encrypted
		} = room;
		const isGroupChat = RocketChat.isGroupChat(room);
		return (
			<SafeAreaView testID='room-actions-view'>
				<StatusBar />
				<List.Container>
					{this.renderRoomInfo()}
					{this.renderJitsi()}
					{this.renderE2EEncryption()}
					<List.Section>
						<List.Separator />

						{(['c', 'p'].includes(t) && canViewMembers) || isGroupChat
							? (
								<>
									<List.Item
										title='Members'
										subtitle={membersCount > 0 ? `${ membersCount } ${ I18n.t('members') }` : null}
										onPress={() => this.onPressTouchable({ route: 'RoomMembersView', params: { rid, room } })}
										testID='room-actions-members'
										left={() => <List.Icon name='team' />}
										showActionIndicator
										translateSubtitle={false}
									/>
									<List.Separator />
								</>
							)
							: null}

						{['c', 'p'].includes(t) && canAddUser
							? (
								<>
									<List.Item
										title='Add_users'
										onPress={() => this.onPressTouchable({
											route: 'SelectedUsersView',
											params: {
												rid,
												title: I18n.t('Add_users'),
												nextAction: this.addUser
											}
										})}
										testID='room-actions-add-user'
										left={() => <List.Icon name='add' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['c', 'p'].includes(t) && canInviteUser
							? (
								<>
									<List.Item
										title='Invite_users'
										onPress={() => this.onPressTouchable({
											route: 'InviteUsersView',
											params: { rid }
										})}
										testID='room-actions-invite-user'
										left={() => <List.Icon name='user-add' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['c', 'p', 'd'].includes(t)
							? (
								<>
									<List.Item
										title='Files'
										onPress={() => this.onPressTouchable({
											route: 'MessagesView',
											params: { rid, t, name: 'Files' }
										})}
										testID='room-actions-files'
										left={() => <List.Icon name='attach' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['c', 'p', 'd'].includes(t)
							? (
								<>
									<List.Item
										title='Mentions'
										onPress={() => this.onPressTouchable({
											route: 'MessagesView',
											params: { rid, t, name: 'Mentions' }
										})}
										testID='room-actions-mentioned'
										left={() => <List.Icon name='mention' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['c', 'p', 'd'].includes(t)
							? (
								<>
									<List.Item
										title='Starred'
										onPress={() => this.onPressTouchable({
											route: 'MessagesView',
											params: { rid, t, name: 'Starred' }
										})}
										testID='room-actions-starred'
										left={() => <List.Icon name='star' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['c', 'p', 'd'].includes(t)
							? (
								<>
									<List.Item
										title='Search'
										onPress={() => this.onPressTouchable({
											route: 'SearchMessagesView',
											params: { rid, encrypted }
										})}
										testID='room-actions-search'
										left={() => <List.Icon name='search' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['c', 'p', 'd'].includes(t)
							? (
								<>
									<List.Item
										title='Share'
										onPress={() => this.onPressTouchable({
											event: this.handleShare
										})}
										testID='room-actions-share'
										left={() => <List.Icon name='share' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['c', 'p', 'd'].includes(t)
							? (
								<>
									<List.Item
										title='Pinned'
										onPress={() => this.onPressTouchable({
											route: 'MessagesView',
											params: { rid, t, name: 'Pinned' }
										})}
										testID='room-actions-pinned'
										left={() => <List.Icon name='pin' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['c', 'p', 'd'].includes(t) && canAutoTranslate
							? (
								<>
									<List.Item
										title='Auto_Translate'
										onPress={() => this.onPressTouchable({
											route: 'AutoTranslateView',
											params: { rid, room }
										})}
										testID='room-actions-auto-translate'
										left={() => <List.Icon name='language' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['c', 'p', 'd'].includes(t) && joined
							? (
								<>
									<List.Item
										title='Notifications'
										onPress={() => this.onPressTouchable({
											route: 'NotificationPrefView',
											params: { rid, room }
										})}
										testID='room-actions-notifications'
										left={() => <List.Icon name='notification' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['l'].includes(t) && !this.isOmnichannelPreview
							? (
								<>
									<List.Item
										title='Close'
										onPress={() => this.onPressTouchable({
											event: this.closeLivechat
										})}
										left={() => <List.Icon name='close' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['l'].includes(t) && !this.isOmnichannelPreview && canForwardGuest
							? (
								<>
									<List.Item
										title='Forward'
										onPress={() => this.onPressTouchable({
											route: 'ForwardLivechatView',
											params: { rid }
										})}
										left={() => <List.Icon name='user-forward' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['l'].includes(t) && !this.isOmnichannelPreview && canReturnQueue
							? (
								<>
									<List.Item
										title='Return'
										onPress={() => this.onPressTouchable({
											event: this.returnLivechat
										})}
										left={() => <List.Icon name='undo' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}

						{['l'].includes(t) && !this.isOmnichannelPreview
							? (
								<>
									<List.Item
										title='Navigation_history'
										onPress={() => this.onPressTouchable({
											route: 'VisitorNavigationView',
											params: { rid }
										})}
										left={() => <List.Icon name='history' />}
										showActionIndicator
									/>
									<List.Separator />
								</>
							)
							: null}
					</List.Section>

					{this.renderLastSection()}
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	jitsiEnabled: state.settings.Jitsi_Enabled || false,
	e2eEnabled: state.settings.E2E_Enable || false
});

const mapDispatchToProps = dispatch => ({
	leaveRoom: (rid, t) => dispatch(leaveRoomAction(rid, t)),
	closeRoom: rid => dispatch(closeRoomAction(rid)),
	setLoadingInvite: loading => dispatch(setLoadingAction(loading))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(withDimensions(RoomActionsView)));

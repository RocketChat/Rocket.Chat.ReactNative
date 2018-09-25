import React from 'react';
import PropTypes from 'prop-types';
import {
	View, SectionList, Text, Alert, SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';

import { leaveRoom as leaveRoomAction } from '../../actions/room';
import LoggedView from '../View';
import styles from './styles';
import sharedStyles from '../Styles';
import Avatar from '../../containers/Avatar';
import Status from '../../containers/status';
import Touch from '../../utils/touch';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

const renderSeparator = () => <View style={styles.separator} />;

@connect(state => ({
	userId: state.login.user && state.login.user.id,
	username: state.login.user && state.login.user.username,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}), dispatch => ({
	leaveRoom: rid => dispatch(leaveRoomAction(rid))
}))
/** @extends React.Component */
export default class RoomActionsView extends LoggedView {
	static propTypes = {
		baseUrl: PropTypes.string,
		rid: PropTypes.string,
		navigator: PropTypes.object,
		userId: PropTypes.string,
		username: PropTypes.string,
		leaveRoom: PropTypes.func
	}

	constructor(props) {
		super('RoomActionsView', props);
		const { rid } = props;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		[this.room] = this.rooms;
		this.state = {
			room: this.room,
			onlineMembers: [],
			allMembers: [],
			member: {}
		};
	}

	async componentDidMount() {
		this.rooms.addListener(this.updateRoom);
		const [members, member] = await Promise.all([this.updateRoomMembers(), this.updateRoomMember()]);
		this.setState({ ...members, ...member });
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
	}

	onPressTouchable = (item) => {
		const { navigator } = this.props;

		if (item.route) {
			navigator.push({
				screen: item.route,
				title: item.name,
				passProps: item.params,
				backButtonTitle: ''
			});
		}
		if (item.event) {
			return item.event();
		}
	}

	get canAddUser() { // Invite user
		const {
			rid, t
		} = this.room;
		const { allMembers } = this.state;
		const { username } = this.props;

		// TODO: same test joined
		const userInRoom = !!allMembers.find(m => m.username === username);
		const permissions = RocketChat.hasPermission(['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room'], rid);

		if (userInRoom && permissions['add-user-to-joined-room']) {
			return true;
		}
		if (t === 'c' && permissions['add-user-to-any-c-room']) {
			return true;
		}
		if (t === 'p' && permissions['add-user-to-any-p-room']) {
			return true;
		}
		return false;
	}

	get canViewMembers() {
		const { room } = this.state;
		const { rid, t, broadcast } = room;
		if (broadcast) {
			const viewBroadcastMemberListPermission = 'view-broadcast-member-list';
			const permissions = RocketChat.hasPermission([viewBroadcastMemberListPermission], rid);
			if (!permissions[viewBroadcastMemberListPermission]) {
				return false;
			}
		}
		return (t === 'c' || t === 'p');
	}

	get sections() {
		const {
			rid, t, blocker, notifications
		} = this.room;
		const { onlineMembers } = this.state;

		const sections = [{
			data: [{
				icon: 'ios-star',
				name: I18n.t('Room_Info'),
				route: 'RoomInfoView',
				params: { rid },
				testID: 'room-actions-info'
			}],
			renderItem: this.renderRoomInfo
		}, {
			data: [
				{
					icon: 'ios-call',
					name: I18n.t('Voice_call'),
					disabled: true,
					testID: 'room-actions-voice'
				},
				{
					icon: 'ios-videocam',
					name: I18n.t('Video_call'),
					disabled: true,
					testID: 'room-actions-video'
				}
			],
			renderItem: this.renderItem
		}, {
			data: [
				{
					icon: 'ios-attach',
					name: I18n.t('Files'),
					route: 'RoomFilesView',
					params: { rid },
					testID: 'room-actions-files'
				},
				{
					icon: 'ios-at',
					name: I18n.t('Mentions'),
					route: 'MentionedMessagesView',
					params: { rid },
					testID: 'room-actions-mentioned'
				},
				{
					icon: 'ios-star',
					name: I18n.t('Starred'),
					route: 'StarredMessagesView',
					params: { rid },
					testID: 'room-actions-starred'
				},
				{
					icon: 'ios-search',
					name: I18n.t('Search'),
					route: 'SearchMessagesView',
					params: { rid },
					testID: 'room-actions-search'
				},
				{
					icon: 'ios-share',
					name: I18n.t('Share'),
					disabled: true,
					testID: 'room-actions-share'
				},
				{
					icon: 'ios-pin',
					name: I18n.t('Pinned'),
					route: 'PinnedMessagesView',
					params: { rid },
					testID: 'room-actions-pinned'
				},
				{
					icon: 'ios-code',
					name: I18n.t('Snippets'),
					route: 'SnippetedMessagesView',
					params: { rid },
					testID: 'room-actions-snippeted'
				},
				{
					icon: `ios-notifications${ notifications ? '' : '-off' }`,
					name: I18n.t(`${ notifications ? 'Enable' : 'Disable' }_notifications`),
					event: () => this.toggleNotifications(),
					testID: 'room-actions-notifications'
				}
			],
			renderItem: this.renderItem
		}];

		if (t === 'd') {
			sections.push({
				data: [
					{
						icon: 'block',
						name: I18n.t(`${ blocker ? 'Unblock' : 'Block' }_user`),
						type: 'danger',
						event: () => this.toggleBlockUser(),
						testID: 'room-actions-block-user'
					}
				],
				renderItem: this.renderItem
			});
		} else if (t === 'c' || t === 'p') {
			const actions = [];

			if (this.canViewMembers) {
				actions.push({
					icon: 'ios-people',
					name: I18n.t('Members'),
					description: (onlineMembers.length === 1
						? I18n.t('1_online_member')
						: I18n.t('N_online_members', { n: onlineMembers.length })),
					route: 'RoomMembersView',
					params: { rid, members: onlineMembers },
					testID: 'room-actions-members'
				});
			}

			if (this.canAddUser) {
				actions.push({
					icon: 'ios-person-add',
					name: I18n.t('Add_user'),
					route: 'SelectedUsersView',
					params: {
						nextAction: 'ADD_USER',
						rid
					},
					testID: 'room-actions-add-user'
				});
			}
			sections[2].data = [...actions, ...sections[2].data];
			sections.push({
				data: [
					{
						icon: 'block',
						name: I18n.t('Leave_channel'),
						type: 'danger',
						event: () => this.leaveChannel(),
						testID: 'room-actions-leave-channel'
					}
				],
				renderItem: this.renderItem
			});
		}
		return sections;
	}

	updateRoomMembers = async() => {
		const { room } = this.state;
		const { rid, t } = room;

		if (!this.canViewMembers) {
			return {};
		}

		if (t === 'c' || t === 'p') {
			let onlineMembers = [];
			let allMembers = [];
			try {
				const onlineMembersCall = RocketChat.getRoomMembers(rid, false);
				const allMembersCall = RocketChat.getRoomMembers(rid, true);
				const [onlineMembersResult, allMembersResult] = await Promise.all([onlineMembersCall, allMembersCall]);
				onlineMembers = onlineMembersResult.records;
				allMembers = allMembersResult.records;
				return { onlineMembers, allMembers };
			} catch (error) {
				return {};
			}
		}
	}

	updateRoomMember = async() => {
		const { room } = this.state;
		const { rid, t } = room;
		const { userId } = this.props;

		if (t !== 'd') {
			return {};
		}
		try {
			const member = await RocketChat.getRoomMember(rid, userId);
			return { member };
		} catch (e) {
			log('RoomActions updateRoomMember', e);
			return {};
		}
	}

	updateRoom = () => {
		this.setState({ room: this.room });
	}

	toggleBlockUser = async() => {
		const { room } = this.state;
		const { rid, blocker } = room;
		const { member } = this.state;
		try {
			RocketChat.toggleBlockUser(rid, member._id, !blocker);
		} catch (e) {
			log('toggleBlockUser', e);
		}
	}

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
					onPress: () => leaveRoom(room.rid)
				}
			]
		);
	}

	toggleNotifications = () => {
		const { room } = this.state;
		try {
			RocketChat.saveNotificationSettings(room.rid, 'mobilePushNotifications', room.notifications ? 'default' : 'nothing');
		} catch (e) {
			log('toggleNotifications', e);
		}
	}

	renderRoomInfo = ({ item }) => {
		const { room, member } = this.state;
		const { name, t, topic } = room;
		const { baseUrl } = this.props;

		return (
			this.renderTouchableItem([
				<Avatar
					key='avatar'
					text={name}
					size={50}
					style={styles.avatar}
					type={t}
					baseUrl={baseUrl}
				>
					{t === 'd' ? <Status style={sharedStyles.status} id={member._id} /> : null }
				</Avatar>,
				<View key='name' style={styles.roomTitleContainer}>
					{room.t === 'd'
						? <Text style={styles.roomTitle}>{room.fname}</Text>
						: (
							<View style={styles.roomTitleRow}>
								<RoomTypeIcon type={room.t} />
								<Text style={styles.roomTitle}>{room.name}</Text>
							</View>
						)
					}
					<Text style={styles.roomDescription} ellipsizeMode='tail' numberOfLines={1}>{t === 'd' ? `@${ name }` : topic}</Text>
				</View>,
				<Icon key='icon' name='ios-arrow-forward' size={20} style={styles.sectionItemIcon} color='#ccc' />
			], item)
		);
	}

	renderTouchableItem = (subview, item) => (
		<Touch
			onPress={() => this.onPressTouchable(item)}
			underlayColor='#FFFFFF'
			activeOpacity={0.5}
			accessibilityLabel={item.name}
			accessibilityTraits='button'
			testID={item.testID}
		>
			<View style={[styles.sectionItem, item.disabled && styles.sectionItemDisabled]}>
				{subview}
			</View>
		</Touch>
	)

	renderItem = ({ item }) => {
		const subview = item.type === 'danger' ? [
			<MaterialIcon key='icon' name={item.icon} size={20} style={[styles.sectionItemIcon, styles.textColorDanger]} />,
			<Text key='name' style={[styles.sectionItemName, styles.textColorDanger]}>{ item.name }</Text>
		] : [
			<Icon key='left-icon' name={item.icon} size={24} style={styles.sectionItemIcon} />,
			<Text key='name' style={styles.sectionItemName}>{ item.name }</Text>,
			item.description ? <Text key='description' style={styles.sectionItemDescription}>{ item.description }</Text> : null,
			<Icon key='right-icon' name='ios-arrow-forward' size={20} style={styles.sectionItemIcon} color='#ccc' />
		];
		return this.renderTouchableItem(subview, item);
	}

	renderSectionSeparator = (data) => {
		if (data.trailingItem) {
			return <View style={[styles.sectionSeparator, data.leadingSection && styles.sectionSeparatorBorder]} />;
		}
		if (!data.trailingSection) {
			return <View style={styles.sectionSeparatorBorder} />;
		}
		return null;
	}

	render() {
		return (
			<SafeAreaView style={styles.container} testID='room-actions-view'>
				<SectionList
					style={styles.container}
					stickySectionHeadersEnabled={false}
					sections={this.sections}
					SectionSeparatorComponent={this.renderSectionSeparator}
					ItemSeparatorComponent={renderSeparator}
					keyExtractor={item => item.name}
					testID='room-actions-list'
					{...scrollPersistTaps}
				/>
			</SafeAreaView>
		);
	}
}

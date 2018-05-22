import React from 'react';
import PropTypes from 'prop-types';
import { View, SectionList, Text, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';

import LoggedView from '../View';
import styles from './styles';
import sharedStyles from '../Styles';
import Avatar from '../../containers/Avatar';
import Status from '../../containers/status';
import Touch from '../../utils/touch';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import { leaveRoom } from '../../actions/room';
import { setLoading } from '../../actions/selectedUsers';
import log from '../../utils/log';
import RoomTypeIcon from '../../containers/RoomTypeIcon';

const renderSeparator = () => <View style={styles.separator} />;
const getRoomTitle = room => (room.t === 'd' ? <Text>{room.fname}</Text> : <Text><RoomTypeIcon type={room.t} />&nbsp;{room.name}</Text>);

@connect(state => ({
	user_id: state.login.user.id,
	user_username: state.login.user.username
}), dispatch => ({
	leaveRoom: rid => dispatch(leaveRoom(rid)),
	setLoadingInvite: loading => dispatch(setLoading(loading))
}))

export default class RoomActionsView extends LoggedView {
	static propTypes = {
		baseUrl: PropTypes.string,
		user: PropTypes.object,
		navigation: PropTypes.object,
		leaveRoom: PropTypes.func
	}

	constructor(props) {
		super('RoomActionsView', props);
		const { rid } = props.navigation.state.params;
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
		if (item.route) {
			return this.props.navigation.navigate({ key: item.route, routeName: item.route, params: item.params });
		}
		if (item.event) {
			return item.event();
		}
	}

	updateRoomMembers = async() => {
		const { t } = this.state.room;

		if (!this.canViewMembers) {
			return {};
		}

		if (t === 'c' || t === 'p') {
			let onlineMembers = [];
			let allMembers = [];
			try {
				const onlineMembersCall = RocketChat.getRoomMembers(this.state.room.rid, false);
				const allMembersCall = RocketChat.getRoomMembers(this.state.room.rid, true);
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
		if (this.state.room.t !== 'd') {
			return {};
		}
		try {
			const member = await RocketChat.getRoomMember(this.state.room.rid, this.props.user_id);
			return { member };
		} catch (e) {
			log('RoomActions updateRoomMember', e);
			return {};
		}
	}

	updateRoom = () => {
		this.setState({ room: this.room });
	}
	get canAddUser() { // Invite user
		const {
			rid, t
		} = this.room;
		const { allMembers } = this.state;
		// TODO: same test joined
		const userInRoom = !!allMembers.find(m => m.username === this.props.user_username);
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
		const { rid, t, broadcast } = this.state.room;
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
				name: 'USER',
				route: 'RoomInfo',
				params: { rid },
				testID: 'room-actions-info'
			}],
			renderItem: this.renderRoomInfo
		}, {
			data: [
				{
					icon: 'ios-call-outline',
					name: 'Voice call',
					disabled: true,
					testID: 'room-actions-voice'
				},
				{
					icon: 'ios-videocam-outline',
					name: 'Video call',
					disabled: true,
					testID: 'room-actions-video'
				}
			],
			renderItem: this.renderItem
		}, {
			data: [
				{
					icon: 'ios-attach',
					name: 'Files',
					route: 'RoomFiles',
					params: { rid },
					testID: 'room-actions-files'
				},
				{
					icon: 'ios-at-outline',
					name: 'Mentions',
					route: 'MentionedMessages',
					params: { rid },
					testID: 'room-actions-mentioned'
				},
				{
					icon: 'ios-star-outline',
					name: 'Starred',
					route: 'StarredMessages',
					params: { rid },
					testID: 'room-actions-starred'
				},
				{
					icon: 'ios-search',
					name: 'Search',
					route: 'SearchMessages',
					params: { rid },
					testID: 'room-actions-search'
				},
				{
					icon: 'ios-share-outline',
					name: 'Share',
					disabled: true,
					testID: 'room-actions-share'
				},
				{
					icon: 'ios-pin',
					name: 'Pinned',
					route: 'PinnedMessages',
					params: { rid },
					testID: 'room-actions-pinned'
				},
				{
					icon: 'ios-code',
					name: 'Snippets',
					route: 'SnippetedMessages',
					params: { rid },
					testID: 'room-actions-snippeted'
				},
				{
					icon: `ios-notifications${ notifications ? '' : '-off' }-outline`,
					name: `${ notifications ? 'Enable' : 'Disable' } notifications`,
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
						name: `${ blocker ? 'Unblock' : 'Block' } user`,
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
					name: 'Members',
					description: (onlineMembers.length === 1 ? `${ onlineMembers.length } member` : `${ onlineMembers.length } members`),
					route: 'RoomMembers',
					params: { rid, members: onlineMembers },
					testID: 'room-actions-members'
				});
			}

			if (this.canAddUser) {
				actions.push({
					icon: 'ios-person-add',
					name: 'Add user',
					route: 'SelectedUsers',
					params: {
						nextAction: async() => {
							try {
								this.props.setLoadingInvite(true);
								await RocketChat.addUsersToRoom(rid);
								this.props.navigation.goBack();
							} catch (e) {
								log('RoomActions Add User', e);
							} finally {
								this.props.setLoadingInvite(false);
							}
						}
					},
					testID: 'room-actions-add-user'
				});
			}
			sections[2].data = [...actions, ...sections[2].data];
			sections.push({
				data: [
					{
						icon: 'block',
						name: 'Leave channel',
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

	toggleBlockUser = async() => {
		const { rid, blocker } = this.state.room;
		const { member } = this.state;
		try {
			RocketChat.toggleBlockUser(rid, member._id, !blocker);
		} catch (e) {
			log('toggleBlockUser', e);
		}
	}

	leaveChannel = () => {
		const { room } = this.state;
		Alert.alert(
			'Are you sure?',
			`Are you sure you want to leave the room ${ getRoomTitle(room) }?`,
			[
				{
					text: 'Cancel',
					style: 'cancel'
				},
				{
					text: 'Yes, leave it!',
					style: 'destructive',
					onPress: () => this.props.leaveRoom(room.rid)
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
		return (
			this.renderTouchableItem([
				<Avatar
					key='avatar'
					text={name}
					size={50}
					style={styles.avatar}
					type={t}
				>
					{t === 'd' ? <Status style={sharedStyles.status} id={member._id} /> : null }
				</Avatar>,
				<View key='name' style={styles.roomTitleContainer}>
					<Text style={styles.roomTitle}>{ getRoomTitle(room) }</Text>
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
			item.description && <Text key='description' style={styles.sectionItemDescription}>{ item.description }</Text>,
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
			<View testID='room-actions-view'>
				<SectionList
					style={styles.container}
					stickySectionHeadersEnabled={false}
					sections={this.sections}
					SectionSeparatorComponent={this.renderSectionSeparator}
					ItemSeparatorComponent={renderSeparator}
					keyExtractor={item => item.name}
					testID='room-actions-list'
				/>
			</View>
		);
	}
}

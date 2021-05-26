import React from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import * as List from '../../containers/List';

import styles from './styles';
import UserItem from '../../presentation/UserItem';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import RocketChat from '../../lib/rocketchat';
import database from '../../lib/database';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import log from '../../utils/log';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { getUserSelector } from '../../selectors/login';
import { withActionSheet } from '../../containers/ActionSheet';
import { showConfirmationAlert, showErrorAlert } from '../../utils/info';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom } from '../../utils/goRoom';
import { CustomIcon } from '../../lib/Icons';

const PAGE_SIZE = 25;

const PERMISSION_MUTE_USER = 'mute-user';
const PERMISSION_SET_LEADER = 'set-leader';
const PERMISSION_SET_OWNER = 'set-owner';
const PERMISSION_SET_MODERATOR = 'set-moderator';
const PERMISSION_REMOVE_USER = 'remove-user';
const PERMISSION_EDIT_TEAM_MEMBER = 'edit-team-member';
const PERMISION_VIEW_ALL_TEAMS = 'view-all-teams';
const PERMISSION_VIEW_ALL_TEAM_CHANNELS = 'view-all-team-channels';

class RoomMembersView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		rid: PropTypes.string,
		members: PropTypes.array,
		baseUrl: PropTypes.string,
		room: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		showActionSheet: PropTypes.func,
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool,
		useRealName: PropTypes.bool,
		muteUserPermission: PropTypes.array,
		setLeaderPermission: PropTypes.array,
		setOwnerPermission: PropTypes.array,
		setModeratorPermission: PropTypes.array,
		removeUserPermission: PropTypes.array,
		editTeamMemberPermission: PropTypes.array,
		viewAllTeamChannelsPermission: PropTypes.array,
		viewAllTeamsPermission: PropTypes.array
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		this.MUTE_INDEX = 0;
		const rid = props.route.params?.rid;
		const room = props.route.params?.room;
		this.state = {
			isLoading: false,
			allUsers: false,
			filtering: false,
			rid,
			members: [],
			membersFiltered: [],
			room: room || {},
			end: false
		};
		if (room && room.observe) {
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
		this.setHeader();
	}

	async componentDidMount() {
		this.mounted = true;
		this.fetchMembers();

		const { room } = this.state;
		const {
			muteUserPermission, setLeaderPermission, setOwnerPermission, setModeratorPermission, removeUserPermission, editTeamMemberPermission, viewAllTeamChannelsPermission, viewAllTeamsPermission
		} = this.props;

		const result = await RocketChat.hasPermission([
			muteUserPermission, setLeaderPermission, setOwnerPermission, setModeratorPermission, removeUserPermission, ...(room.teamMain ? [editTeamMemberPermission, viewAllTeamChannelsPermission, viewAllTeamsPermission] : [])
		], room.rid);

		this.permissions = {
			[PERMISSION_MUTE_USER]: result[0],
			[PERMISSION_SET_LEADER]: result[1],
			[PERMISSION_SET_OWNER]: result[2],
			[PERMISSION_SET_MODERATOR]: result[3],
			[PERMISSION_REMOVE_USER]: result[4],
			...(room.teamMain ? {
				[PERMISSION_EDIT_TEAM_MEMBER]: result[5],
				[PERMISSION_VIEW_ALL_TEAM_CHANNELS]: result[6],
				[PERMISION_VIEW_ALL_TEAMS]: result[7]
			} : {})
		};

		const hasSinglePermission = Object.values(this.permissions).some(p => !!p);
		if (hasSinglePermission) {
			this.fetchRoomMembersRoles();
		}
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	setHeader = () => {
		const { allUsers } = this.state;
		const { navigation } = this.props;
		const toggleText = allUsers ? I18n.t('Online') : I18n.t('All');
		navigation.setOptions({
			title: I18n.t('Members'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item title={toggleText} onPress={this.toggleStatus} testID='room-members-view-toggle-status' />
				</HeaderButton.Container>
			)
		});
	}

	onSearchChangeText = protectedFunction((text) => {
		const { members } = this.state;
		let membersFiltered = [];
		text = text.trim();

		if (members && members.length > 0 && text) {
			membersFiltered = members.filter(m => m.username.toLowerCase().match(text.toLowerCase()) || m.name.toLowerCase().match(text.toLowerCase()));
		}
		this.setState({ filtering: !!text, membersFiltered });
	})

	navToDirectMessage = async(item) => {
		try {
			const db = database.active;
			const subsCollection = db.get('subscriptions');
			const query = await subsCollection.query(Q.where('name', item.username)).fetch();
			if (query.length) {
				const [room] = query;
				this.goRoom(room);
			} else {
				const result = await RocketChat.createDirectMessage(item.username);
				if (result.success) {
					this.goRoom({ rid: result.room?._id, name: item.username, t: 'd' });
				}
			}
		} catch (e) {
			log(e);
		}
	}

	handleRemoveFromTeam = async(selectedUser) => {
		try {
			const { navigation } = this.props;
			const { room } = this.state;

			const result = await RocketChat.teamListRoomsOfUser({ teamId: room.teamId, userId: selectedUser._id });

			if (result.rooms?.length) {
				const teamChannels = result.rooms.map(r => ({
					rid: r._id,
					name: r.name,
					teamId: r.teamId,
					alert: r.isLastOwner
				}));
				navigation.navigate('SelectListView', {
					title: 'Remove_Member',
					infoText: 'Remove_User_Team_Channels',
					data: teamChannels,
					nextAction: selected => this.removeFromTeam(selectedUser, selected),
					showAlert: () => showErrorAlert(I18n.t('Last_owner_team_room'), I18n.t('Cannot_remove'))
				});
			} else {
				showConfirmationAlert({
					message: I18n.t('Removing_user_from_this_team', { user: selectedUser.username }),
					confirmationText: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
					onPress: () => this.removeFromTeam(selectedUser)
				});
			}
		} catch (e) {
			showConfirmationAlert({
				message: I18n.t('Removing_user_from_this_team', { user: selectedUser.username }),
				confirmationText: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
				onPress: () => this.removeFromTeam(selectedUser)
			});
		}
	}

	removeFromTeam = async(selectedUser, selected) => {
		try {
			const { members, membersFiltered, room } = this.state;
			const { navigation } = this.props;

			const userId = selectedUser._id;
			const result = await RocketChat.removeTeamMember({
				teamId: room.teamId,
				teamName: room.name,
				userId,
				...(selected && { rooms: selected })
			});
			if (result.success) {
				const message = I18n.t('User_has_been_removed_from_s', { s: RocketChat.getRoomTitle(room) });
				EventEmitter.emit(LISTENER, { message });
				const newMembers = members.filter(member => member._id !== userId);
				const newMembersFiltered = membersFiltered.filter(member => member._id !== userId);
				this.setState({
					members: newMembers,
					membersFiltered: newMembersFiltered
				});
				navigation.navigate('RoomMembersView');
			}
		} catch (e) {
			log(e);
			showErrorAlert(
				e.data.error
					? I18n.t(e.data.error)
					: I18n.t('There_was_an_error_while_action', { action: I18n.t('removing_team') }),
				I18n.t('Cannot_remove')
			);
		}
	}

	onPressUser = (selectedUser) => {
		const { room } = this.state;
		const { showActionSheet, user, theme } = this.props;

		const options = [{
			icon: 'message',
			title: I18n.t('Direct_message'),
			onPress: () => this.navToDirectMessage(selectedUser)
		}];

		// Ignore
		if (selectedUser._id !== user.id) {
			const { ignored } = room;
			const isIgnored = ignored?.includes?.(selectedUser._id);
			options.push({
				icon: 'ignore',
				title: I18n.t(isIgnored ? 'Unignore' : 'Ignore'),
				onPress: () => this.handleIgnore(selectedUser, !isIgnored)
			});
		}

		if (this.permissions['mute-user']) {
			const { muted = [] } = room;
			const userIsMuted = muted.find?.(m => m === selectedUser.username);
			selectedUser.muted = !!userIsMuted;
			options.push({
				icon: userIsMuted ? 'audio' : 'audio-disabled',
				title: I18n.t(userIsMuted ? 'Unmute' : 'Mute'),
				onPress: () => {
					showConfirmationAlert({
						message: I18n.t(`The_user_${ userIsMuted ? 'will' : 'wont' }_be_able_to_type_in_roomName`, {
							roomName: RocketChat.getRoomTitle(room)
						}),
						confirmationText: I18n.t(userIsMuted ? 'Unmute' : 'Mute'),
						onPress: () => this.handleMute(selectedUser)
					});
				}
			});
		}

		// Owner
		if (this.permissions['set-owner']) {
			const userRoleResult = this.roomRoles.find(r => r.u._id === selectedUser._id);
			const isOwner = userRoleResult?.roles.includes('owner');
			options.push({
				icon: 'shield-check',
				title: I18n.t('Owner'),
				onPress: () => this.handleOwner(selectedUser, !isOwner),
				right: () => <CustomIcon name={isOwner ? 'checkbox-checked' : 'checkbox-unchecked'} size={20} color={isOwner ? themes[theme].tintActive : themes[theme].auxiliaryTintColor} />
			});
		}

		// Leader
		if (this.permissions['set-leader']) {
			const userRoleResult = this.roomRoles.find(r => r.u._id === selectedUser._id);
			const isLeader = userRoleResult?.roles.includes('leader');
			options.push({
				icon: 'shield-alt',
				title: I18n.t('Leader'),
				onPress: () => this.handleLeader(selectedUser, !isLeader),
				right: () => <CustomIcon name={isLeader ? 'checkbox-checked' : 'checkbox-unchecked'} size={20} color={isLeader ? themes[theme].tintActive : themes[theme].auxiliaryTintColor} />
			});
		}

		// Moderator
		if (this.permissions['set-moderator']) {
			const userRoleResult = this.roomRoles.find(r => r.u._id === selectedUser._id);
			const isModerator = userRoleResult?.roles.includes('moderator');
			options.push({
				icon: 'shield',
				title: I18n.t('Moderator'),
				onPress: () => this.handleModerator(selectedUser, !isModerator),
				right: () => <CustomIcon name={isModerator ? 'checkbox-checked' : 'checkbox-unchecked'} size={20} color={isModerator ? themes[theme].tintActive : themes[theme].auxiliaryTintColor} />
			});
		}

		// Remove from team
		if (this.permissions['edit-team-member']) {
			options.push({
				icon: 'logout',
				danger: true,
				title: I18n.t('Remove_from_Team'),
				onPress: () => this.handleRemoveFromTeam(selectedUser)
			});
		}

		// Remove from room
		if (this.permissions['remove-user'] && !room.teamMain) {
			options.push({
				icon: 'logout',
				title: I18n.t('Remove_from_room'),
				danger: true,
				onPress: () => {
					showConfirmationAlert({
						message: I18n.t('The_user_will_be_removed_from_s', { s: RocketChat.getRoomTitle(room) }),
						confirmationText: I18n.t('Yes_remove_user'),
						onPress: () => this.handleRemoveUserFromRoom(selectedUser)
					});
				}
			});
		}

		showActionSheet({
			options,
			hasCancel: true
		});
	}

	toggleStatus = () => {
		try {
			const { allUsers } = this.state;
			this.setState({ members: [], allUsers: !allUsers, end: false }, () => {
				this.fetchMembers();
			});
		} catch (e) {
			log(e);
		}
	}

	fetchRoomMembersRoles = async() => {
		try {
			const { room } = this.state;
			const result = await RocketChat.getRoomRoles(room.rid, room.t);
			if (result?.success) {
				this.roomRoles = result.roles;
			}
		} catch (e) {
			log(e);
		}
	}

	fetchMembers = async() => {
		const {
			rid, members, isLoading, allUsers, end
		} = this.state;
		if (isLoading || end) {
			return;
		}

		this.setState({ isLoading: true });
		try {
			const membersResult = await RocketChat.getRoomMembers(rid, allUsers, members.length, PAGE_SIZE);
			const newMembers = membersResult.records;
			this.setState({
				members: members.concat(newMembers || []),
				isLoading: false,
				end: newMembers.length < PAGE_SIZE
			});
			this.setHeader();
		} catch (e) {
			log(e);
			this.setState({ isLoading: false });
		}
	}

	goRoom = (item) => {
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('DrawerNavigator');
		} else {
			navigation.popToTop();
		}
		goRoom({ item, isMasterDetail });
	}

	getUserDisplayName = (user) => {
		const { useRealName } = this.props;
		return (useRealName ? user.name : user.username) || user.username;
	}

	handleMute = async(user) => {
		const { rid } = this.state;
		try {
			await RocketChat.toggleMuteUserInRoom(rid, user?.username, !user?.muted);
			EventEmitter.emit(LISTENER, { message: I18n.t('User_has_been_key', { key: user?.muted ? I18n.t('unmuted') : I18n.t('muted') }) });
		} catch (e) {
			log(e);
		}
	}

	handleOwner = async(selectedUser, isOwner) => {
		try {
			const { room } = this.state;
			await RocketChat.toggleRoomOwner({
				roomId: room.rid, t: room.t, userId: selectedUser._id, isOwner
			});
			const message = isOwner ? 'User__username__is_now_a_owner_of__room_name_' : 'User__username__removed_from__room_name__owners';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: this.getUserDisplayName(selectedUser),
					room_name: RocketChat.getRoomTitle(room)
				})
			});
		} catch (e) {
			log(e);
		}
		this.fetchRoomMembersRoles();
	}

	handleLeader = async(selectedUser, isLeader) => {
		try {
			const { room } = this.state;
			await RocketChat.toggleRoomLeader({
				roomId: room.rid, t: room.t, userId: selectedUser._id, isLeader
			});
			const message = isLeader ? 'User__username__is_now_a_leader_of__room_name_' : 'User__username__removed_from__room_name__leaders';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: this.getUserDisplayName(selectedUser),
					room_name: RocketChat.getRoomTitle(room)
				})
			});
		} catch (e) {
			log(e);
		}
		this.fetchRoomMembersRoles();
	}

	handleModerator = async(selectedUser, isModerator) => {
		try {
			const { room } = this.state;
			await RocketChat.toggleRoomModerator({
				roomId: room.rid, t: room.t, userId: selectedUser._id, isModerator
			});
			const message = isModerator ? 'User__username__is_now_a_moderator_of__room_name_' : 'User__username__removed_from__room_name__moderators';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: this.getUserDisplayName(selectedUser),
					room_name: RocketChat.getRoomTitle(room)
				})
			});
		} catch (e) {
			log(e);
		}
		this.fetchRoomMembersRoles();
	}

	handleIgnore = async(selectedUser, ignore) => {
		try {
			const { room } = this.state;
			await RocketChat.ignoreUser({
				rid: room.rid, userId: selectedUser._id, ignore
			});
			const message = I18n.t(ignore ? 'User_has_been_ignored' : 'User_has_been_unignored');
			EventEmitter.emit(LISTENER, { message });
		} catch (e) {
			log(e);
		}
	}

	handleRemoveUserFromRoom = async(selectedUser) => {
		try {
			const { room, members, membersFiltered } = this.state;
			const userId = selectedUser._id;
			await RocketChat.removeUserFromRoom({ roomId: room.rid, t: room.t, userId });
			const message = I18n.t('User_has_been_removed_from_s', { s: RocketChat.getRoomTitle(room) });
			EventEmitter.emit(LISTENER, { message });
			this.setState({
				members: members.filter(member => member._id !== userId),
				membersFiltered: membersFiltered.filter(member => member._id !== userId)
			});
		} catch (e) {
			log(e);
		}
	}

	renderSearchBar = () => (
		<SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='room-members-view-search' />
	)

	renderItem = ({ item }) => {
		const { baseUrl, user, theme } = this.props;

		return (
			<UserItem
				name={item.name}
				username={item.username}
				onPress={() => this.onPressUser(item)}
				baseUrl={baseUrl}
				testID={`room-members-view-item-${ item.username }`}
				user={user}
				theme={theme}
			/>
		);
	}

	render() {
		const {
			filtering, members, membersFiltered, isLoading
		} = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView testID='room-members-view'>
				<StatusBar />
				<FlatList
					data={filtering ? membersFiltered : members}
					renderItem={this.renderItem}
					style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
					keyExtractor={item => item._id}
					ItemSeparatorComponent={List.Separator}
					ListHeaderComponent={this.renderSearchBar}
					ListFooterComponent={() => {
						if (isLoading) {
							return <ActivityIndicator theme={theme} />;
						}
						return null;
					}}
					onEndReachedThreshold={0.1}
					onEndReached={this.fetchMembers}
					maxToRenderPerBatch={5}
					windowSize={10}
					{...scrollPersistTaps}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	useRealName: state.settings.UI_Use_Real_Name,
	muteUserPermission: state.permissions[PERMISSION_MUTE_USER],
	setLeaderPermission: state.permissions[PERMISSION_SET_LEADER],
	setOwnerPermission: state.permissions[PERMISSION_SET_OWNER],
	setModeratorPermission: state.permissions[PERMISSION_SET_MODERATOR],
	removeUserPermission: state.permissions[PERMISSION_REMOVE_USER],
	editTeamMemberPermission: state.permissions[PERMISSION_EDIT_TEAM_MEMBER],
	viewAllTeamChannelsPermission: state.permissions[PERMISSION_VIEW_ALL_TEAM_CHANNELS],
	viewAllTeamsPermission: state.permissions[PERMISION_VIEW_ALL_TEAMS]
});

export default connect(mapStateToProps)(withActionSheet(withTheme(RoomMembersView)));

import { Q } from '@nozbe/watermelondb';
import React from 'react';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import { Observable, Subscription } from 'rxjs';

import { themes } from '../../lib/constants';
import { TActionSheetOptions, TActionSheetOptionsItem, withActionSheet } from '../../containers/ActionSheet';
import ActivityIndicator from '../../containers/ActivityIndicator';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import SearchBox from '../../containers/SearchBox';
import StatusBar from '../../containers/StatusBar';
import { LISTENER } from '../../containers/Toast';
import { IApplicationState, IBaseScreen, IUser, SubscriptionType, TSubscriptionModel, TUserModel } from '../../definitions';
import I18n from '../../i18n';
import database from '../../lib/database';
import { CustomIcon } from '../../containers/CustomIcon';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import UserItem from '../../containers/UserItem';
import { getUserSelector } from '../../selectors/login';
import { ModalStackParamList } from '../../stacks/MasterDetailStack/types';
import { TSupportedThemes, withTheme } from '../../theme';
import EventEmitter from '../../utils/events';
import { goRoom, TGoRoomItem } from '../../utils/goRoom';
import { showConfirmationAlert, showErrorAlert } from '../../utils/info';
import log from '../../utils/log';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { TSupportedPermissions } from '../../reducers/permissions';
import { getRoomTitle, hasPermission, isGroupChat, RoomTypes } from '../../lib/methods';
import styles from './styles';
import { Services } from '../../lib/services';

const PAGE_SIZE = 25;

interface IRoomMembersViewProps extends IBaseScreen<ModalStackParamList, 'RoomMembersView'> {
	rid: string;
	members: string[];
	baseUrl: string;
	room: TSubscriptionModel;
	user: {
		id: string;
		token: string;
		roles: string[];
	};
	showActionSheet: (params: TActionSheetOptions) => {};
	theme: TSupportedThemes;
	isMasterDetail: boolean;
	useRealName: boolean;
	muteUserPermission: string[];
	setLeaderPermission: string[];
	setOwnerPermission: string[];
	setModeratorPermission: string[];
	removeUserPermission: string[];
	editTeamMemberPermission: string[];
	viewAllTeamChannelsPermission: string[];
	viewAllTeamsPermission: string[];
}

interface IRoomMembersViewState {
	isLoading: boolean;
	allUsers: boolean;
	filtering: boolean;
	rid: string;
	members: TUserModel[];
	membersFiltered: TUserModel[];
	room: TSubscriptionModel;
	end: boolean;
}

class RoomMembersView extends React.Component<IRoomMembersViewProps, IRoomMembersViewState> {
	private mounted: boolean;
	private permissions: { [key in TSupportedPermissions]?: boolean };
	private roomObservable!: Observable<TSubscriptionModel>;
	private subscription!: Subscription;
	private roomRoles: any;

	constructor(props: IRoomMembersViewProps) {
		super(props);
		this.mounted = false;
		this.permissions = {};
		const rid = props.route.params?.rid;
		const room = props.route.params?.room;
		this.state = {
			isLoading: false,
			allUsers: false,
			filtering: false,
			rid,
			members: [],
			membersFiltered: [],
			room: room || ({} as TSubscriptionModel),
			end: false
		};
		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable.subscribe(changes => {
				if (this.mounted) {
					this.setState({ room: changes });
				} else {
					this.setState({ room: changes });
				}
			});
		}
		this.setHeader();
	}

	async componentDidMount() {
		const { room } = this.state;
		this.mounted = true;
		this.fetchMembers();

		if (isGroupChat(room)) {
			return;
		}

		const {
			muteUserPermission,
			setLeaderPermission,
			setOwnerPermission,
			setModeratorPermission,
			removeUserPermission,
			editTeamMemberPermission,
			viewAllTeamChannelsPermission,
			viewAllTeamsPermission
		} = this.props;

		const result = await hasPermission(
			[
				muteUserPermission,
				setLeaderPermission,
				setOwnerPermission,
				setModeratorPermission,
				removeUserPermission,
				...(room.teamMain ? [editTeamMemberPermission, viewAllTeamChannelsPermission, viewAllTeamsPermission] : [])
			],
			room.rid
		);

		this.permissions = {
			'mute-user': result[0],
			'set-leader': result[1],
			'set-owner': result[2],
			'set-moderator': result[3],
			'remove-user': result[4],
			...(room.teamMain
				? {
						'edit-team-member': result[5],
						'view-all-team-channels': result[6],
						'view-all-teams': result[7]
				  }
				: {})
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
	};

	onSearchChangeText = protectedFunction((text: string) => {
		const { members } = this.state;
		let membersFiltered: TUserModel[] = [];
		text = text.trim();

		if (members && members.length > 0 && text) {
			membersFiltered = members.filter(
				m => m.username.toLowerCase().match(text.toLowerCase()) || m.name?.toLowerCase().match(text.toLowerCase())
			);
		}
		this.setState({ filtering: !!text, membersFiltered });
	});

	navToDirectMessage = async (item: IUser) => {
		try {
			const db = database.active;
			const subsCollection = db.get('subscriptions');
			const query = await subsCollection.query(Q.where('name', item.username)).fetch();
			if (query.length) {
				const [room] = query;
				this.goRoom(room);
			} else {
				const result = await Services.createDirectMessage(item.username);
				if (result.success) {
					this.goRoom({ rid: result.room?._id as string, name: item.username, t: SubscriptionType.DIRECT });
				}
			}
		} catch (e) {
			log(e);
		}
	};

	handleRemoveFromTeam = async (selectedUser: TUserModel) => {
		try {
			const { navigation } = this.props;
			const { room } = this.state;

			const result = await Services.teamListRoomsOfUser({ teamId: room.teamId as string, userId: selectedUser._id });

			if (result.success) {
				if (result.rooms?.length) {
					const teamChannels = result.rooms.map((r: any) => ({
						rid: r._id,
						name: r.name,
						teamId: r.teamId,
						alert: r.isLastOwner
					}));
					navigation.navigate('SelectListView', {
						title: 'Remove_Member',
						infoText: 'Remove_User_Team_Channels',
						data: teamChannels,
						nextAction: (selected: any) => this.removeFromTeam(selectedUser, selected),
						showAlert: () => showErrorAlert(I18n.t('Last_owner_team_room'), I18n.t('Cannot_remove'))
					});
				} else {
					showConfirmationAlert({
						message: I18n.t('Removing_user_from_this_team', { user: selectedUser.username }),
						confirmationText: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
						onPress: () => this.removeFromTeam(selectedUser)
					});
				}
			}
		} catch (e) {
			showConfirmationAlert({
				message: I18n.t('Removing_user_from_this_team', { user: selectedUser.username }),
				confirmationText: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
				onPress: () => this.removeFromTeam(selectedUser)
			});
		}
	};

	removeFromTeam = async (selectedUser: IUser, selected?: any) => {
		try {
			const { members, membersFiltered, room } = this.state;
			const { navigation } = this.props;

			const userId = selectedUser._id;
			const result = await Services.removeTeamMember({
				teamId: room.teamId,
				userId,
				...(selected && { rooms: selected })
			});
			if (result.success) {
				const message = I18n.t('User_has_been_removed_from_s', { s: getRoomTitle(room) });
				EventEmitter.emit(LISTENER, { message });
				const newMembers = members.filter(member => member._id !== userId);
				const newMembersFiltered = membersFiltered.filter(member => member._id !== userId);
				this.setState({
					members: newMembers,
					membersFiltered: newMembersFiltered
				});
				// @ts-ignore - This is just to force a reload
				navigation.navigate('RoomMembersView');
			}
		} catch (e: any) {
			log(e);
			showErrorAlert(
				e.data.error ? I18n.t(e.data.error) : I18n.t('There_was_an_error_while_action', { action: I18n.t('removing_team') }),
				I18n.t('Cannot_remove')
			);
		}
	};

	onPressUser = (selectedUser: TUserModel) => {
		const { room } = this.state;
		const { showActionSheet, user, theme } = this.props;

		const options: TActionSheetOptionsItem[] = [
			{
				icon: 'message',
				title: I18n.t('Direct_message'),
				onPress: () => this.navToDirectMessage(selectedUser)
			}
		];

		// Ignore
		if (selectedUser._id !== user.id) {
			const { ignored } = room;
			const isIgnored = ignored?.includes?.(selectedUser._id);
			options.push({
				icon: 'ignore',
				title: I18n.t(isIgnored ? 'Unignore' : 'Ignore'),
				onPress: () => this.handleIgnore(selectedUser, !isIgnored),
				testID: 'action-sheet-ignore-user'
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
						message: I18n.t(`The_user_${userIsMuted ? 'will' : 'wont'}_be_able_to_type_in_roomName`, {
							roomName: getRoomTitle(room)
						}),
						confirmationText: I18n.t(userIsMuted ? 'Unmute' : 'Mute'),
						onPress: () => this.handleMute(selectedUser)
					});
				},
				testID: 'action-sheet-mute-user'
			});
		}

		// Owner
		if (this.permissions['set-owner']) {
			const userRoleResult = this.roomRoles.find((r: any) => r.u._id === selectedUser._id);
			const isOwner = userRoleResult?.roles.includes('owner');
			options.push({
				icon: 'shield-check',
				title: I18n.t('Owner'),
				onPress: () => this.handleOwner(selectedUser, !isOwner),
				right: () => (
					<CustomIcon
						testID={isOwner ? 'action-sheet-set-owner-checked' : 'action-sheet-set-owner-unchecked'}
						name={isOwner ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={20}
						color={isOwner ? themes[theme].tintActive : themes[theme].auxiliaryTintColor}
					/>
				),
				testID: 'action-sheet-set-owner'
			});
		}

		// Leader
		if (this.permissions['set-leader']) {
			const userRoleResult = this.roomRoles.find((r: any) => r.u._id === selectedUser._id);
			const isLeader = userRoleResult?.roles.includes('leader');
			options.push({
				icon: 'shield-alt',
				title: I18n.t('Leader'),
				onPress: () => this.handleLeader(selectedUser, !isLeader),
				right: () => (
					<CustomIcon
						testID={isLeader ? 'action-sheet-set-leader-checked' : 'action-sheet-set-leader-unchecked'}
						name={isLeader ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={20}
						color={isLeader ? themes[theme].tintActive : themes[theme].auxiliaryTintColor}
					/>
				),
				testID: 'action-sheet-set-leader'
			});
		}

		// Moderator
		if (this.permissions['set-moderator']) {
			const userRoleResult = this.roomRoles.find((r: any) => r.u._id === selectedUser._id);
			const isModerator = userRoleResult?.roles.includes('moderator');
			options.push({
				icon: 'shield',
				title: I18n.t('Moderator'),
				onPress: () => this.handleModerator(selectedUser, !isModerator),
				right: () => (
					<CustomIcon
						testID={isModerator ? 'action-sheet-set-moderator-checked' : 'action-sheet-set-moderator-unchecked'}
						name={isModerator ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={20}
						color={isModerator ? themes[theme].tintActive : themes[theme].auxiliaryTintColor}
					/>
				),
				testID: 'action-sheet-set-moderator'
			});
		}

		// Remove from team
		if (this.permissions['edit-team-member']) {
			options.push({
				icon: 'logout',
				danger: true,
				title: I18n.t('Remove_from_Team'),
				onPress: () => this.handleRemoveFromTeam(selectedUser),
				testID: 'action-sheet-remove-from-team'
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
						message: I18n.t('The_user_will_be_removed_from_s', { s: getRoomTitle(room) }),
						confirmationText: I18n.t('Yes_remove_user'),
						onPress: () => this.handleRemoveUserFromRoom(selectedUser)
					});
				},
				testID: 'action-sheet-remove-from-room'
			});
		}

		showActionSheet({
			options,
			hasCancel: true
		});
	};

	toggleStatus = () => {
		try {
			const { allUsers } = this.state;
			this.setState({ members: [], allUsers: !allUsers, end: false }, () => {
				this.fetchMembers();
			});
		} catch (e) {
			log(e);
		}
	};

	fetchRoomMembersRoles = async () => {
		try {
			const { room } = this.state;
			const type = room.t as SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.OMNICHANNEL;
			const result = await Services.getRoomRoles(room.rid, type);
			if (result?.success) {
				this.roomRoles = result.roles;
			}
		} catch (e) {
			log(e);
		}
	};

	fetchMembers = async () => {
		const { rid, members, isLoading, allUsers, end, room, filtering } = this.state;
		const { t } = room;
		if (isLoading || end) {
			return;
		}

		this.setState({ isLoading: true });
		try {
			const membersResult = await Services.getRoomMembers({
				rid,
				roomType: t,
				type: allUsers ? 'all' : 'online',
				filter: filtering,
				skip: members.length,
				limit: PAGE_SIZE,
				allUsers
			});
			this.setState({
				members: members.concat(membersResult || []),
				isLoading: false,
				end: membersResult?.length < PAGE_SIZE
			});
			this.setHeader();
		} catch (e) {
			log(e);
			this.setState({ isLoading: false });
		}
	};

	goRoom = (item: TGoRoomItem) => {
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			// @ts-ignore
			navigation.navigate('DrawerNavigator');
		} else {
			navigation.popToTop();
		}
		goRoom({ item, isMasterDetail });
	};

	getUserDisplayName = (user: TUserModel) => {
		const { useRealName } = this.props;
		return (useRealName ? user.name : user.username) || user.username;
	};

	handleMute = async (user: TUserModel) => {
		const { rid } = this.state;
		try {
			await Services.toggleMuteUserInRoom(rid, user?.username, !user?.muted);
			EventEmitter.emit(LISTENER, {
				message: I18n.t('User_has_been_key', { key: user?.muted ? I18n.t('unmuted') : I18n.t('muted') })
			});
		} catch (e) {
			log(e);
		}
	};

	handleOwner = async (selectedUser: TUserModel, isOwner: boolean) => {
		try {
			const { room } = this.state;
			await Services.toggleRoomOwner({
				roomId: room.rid,
				t: room.t,
				userId: selectedUser._id,
				isOwner
			});
			const message = isOwner
				? 'User__username__is_now_a_owner_of__room_name_'
				: 'User__username__removed_from__room_name__owners';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: this.getUserDisplayName(selectedUser),
					room_name: getRoomTitle(room)
				})
			});
		} catch (e) {
			log(e);
		}
		this.fetchRoomMembersRoles();
	};

	handleLeader = async (selectedUser: TUserModel, isLeader: boolean) => {
		try {
			const { room } = this.state;
			await Services.toggleRoomLeader({
				roomId: room.rid,
				t: room.t,
				userId: selectedUser._id,
				isLeader
			});
			const message = isLeader
				? 'User__username__is_now_a_leader_of__room_name_'
				: 'User__username__removed_from__room_name__leaders';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: this.getUserDisplayName(selectedUser),
					room_name: getRoomTitle(room)
				})
			});
		} catch (e) {
			log(e);
		}
		this.fetchRoomMembersRoles();
	};

	handleModerator = async (selectedUser: TUserModel, isModerator: boolean) => {
		try {
			const { room } = this.state;
			await Services.toggleRoomModerator({
				roomId: room.rid,
				t: room.t,
				userId: selectedUser._id,
				isModerator
			});
			const message = isModerator
				? 'User__username__is_now_a_moderator_of__room_name_'
				: 'User__username__removed_from__room_name__moderators';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: this.getUserDisplayName(selectedUser),
					room_name: getRoomTitle(room)
				})
			});
		} catch (e) {
			log(e);
		}
		this.fetchRoomMembersRoles();
	};

	handleIgnore = async (selectedUser: TUserModel, ignore: boolean) => {
		try {
			const { room } = this.state;
			await Services.ignoreUser({
				rid: room.rid,
				userId: selectedUser._id,
				ignore
			});
			const message = I18n.t(ignore ? 'User_has_been_ignored' : 'User_has_been_unignored');
			EventEmitter.emit(LISTENER, { message });
		} catch (e) {
			log(e);
		}
	};

	handleRemoveUserFromRoom = async (selectedUser: TUserModel) => {
		try {
			const { room, members, membersFiltered } = this.state;
			const userId = selectedUser._id;
			// TODO: interface SubscriptionType on IRoom is wrong
			await Services.removeUserFromRoom({ roomId: room.rid, t: room.t as RoomTypes, userId });
			const message = I18n.t('User_has_been_removed_from_s', { s: getRoomTitle(room) });
			EventEmitter.emit(LISTENER, { message });
			this.setState({
				members: members.filter(member => member._id !== userId),
				membersFiltered: membersFiltered.filter(member => member._id !== userId)
			});
		} catch (e) {
			log(e);
		}
	};

	renderSearchBar = () => <SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='room-members-view-search' />;

	renderItem = ({ item }: { item: TUserModel }) => {
		const { theme } = this.props;

		return (
			<UserItem
				name={item.name as string}
				username={item.username}
				onPress={() => this.onPressUser(item)}
				testID={`room-members-view-item-${item.username}`}
				theme={theme}
			/>
		);
	};

	render() {
		const { filtering, members, membersFiltered, isLoading } = this.state;
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
							return <ActivityIndicator />;
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

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	useRealName: state.settings.UI_Use_Real_Name,
	muteUserPermission: state.permissions['mute-user'],
	setLeaderPermission: state.permissions['set-leader'],
	setOwnerPermission: state.permissions['set-owner'],
	setModeratorPermission: state.permissions['set-moderator'],
	removeUserPermission: state.permissions['remove-user'],
	editTeamMemberPermission: state.permissions['edit-team-member'],
	viewAllTeamChannelsPermission: state.permissions['view-all-team-channels'],
	viewAllTeamsPermission: state.permissions['view-all-teams']
});

export default connect(mapStateToProps)(withTheme(withActionSheet(RoomMembersView)));

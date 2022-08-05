import { Q } from '@nozbe/watermelondb';
import { NavigationProp, RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useReducer } from 'react';
import { FlatList } from 'react-native';

import { TActionSheetOptionsItem, useActionSheet } from '../../containers/ActionSheet';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { CustomIcon } from '../../containers/CustomIcon';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import { RadioButton } from '../../containers/RadioButton';
import SafeAreaView from '../../containers/SafeAreaView';
import SearchBox from '../../containers/SearchBox';
import StatusBar from '../../containers/StatusBar';
import { LISTENER } from '../../containers/Toast';
import UserItem from '../../containers/UserItem';
import { IUser, SubscriptionType, TSubscriptionModel, TUserModel } from '../../definitions';
import I18n from '../../i18n';
import database from '../../lib/database';
import { useAppSelector, usePermissions } from '../../lib/hooks';
import { RoomTypes } from '../../lib/methods';
import { getRoomTitle, isGroupChat } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { goRoom, TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import { showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers/info';
import log from '../../lib/methods/helpers/log';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { Services } from '../../lib/services';
import { TSupportedPermissions } from '../../reducers/permissions';
import { getUserSelector } from '../../selectors/login';
import { ModalStackParamList } from '../../stacks/MasterDetailStack/types';
import { useTheme } from '../../theme';
import MembersSection from './components/MembersSection';
import styles from './styles';

const PAGE_SIZE = 25;

interface IRoomMembersViewState {
	isLoading: boolean;
	allUsers: boolean;
	filtering: boolean;
	members: TUserModel[];
	room: TSubscriptionModel;
	end: boolean;
	roomRoles: any;
	filter: string;
}

const RoomMembersView = (): React.ReactElement => {
	const { showActionSheet } = useActionSheet();
	const { colors } = useTheme();

	const { params } = useRoute<RouteProp<ModalStackParamList, 'RoomMembersView'>>();
	const navigation = useNavigation<NavigationProp<ModalStackParamList, 'RoomMembersView'>>();

	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const user = useAppSelector(state => getUserSelector(state));

	const [state, updateState] = useReducer(
		(state: IRoomMembersViewState, newState: Partial<IRoomMembersViewState>) => ({ ...state, ...newState }),
		{
			isLoading: false,
			allUsers: false,
			filtering: false,
			members: [],
			room: params.room || ({} as TSubscriptionModel),
			end: false,
			roomRoles: null,
			filter: ''
		}
	);

	const teamPermissions: TSupportedPermissions[] = state.room.teamMain
		? ['edit-team-member', 'view-all-team-channels', 'view-all-teams']
		: [];

	const [
		muteUserPermission,
		setLeaderPermission,
		setOwnerPermission,
		setModeratorPermission,
		removeUserPermission,
		editTeamMemberPermission,
		viewAllTeamChannelsPermission,
		viewAllTeamsPermission
	] = usePermissions(['mute-user', 'set-leader', 'set-owner', 'set-moderator', 'remove-user', ...teamPermissions], params.rid);

	useEffect(() => {
		const subscription = params.room.observe().subscribe(changes => updateState({ room: changes }));
		setHeader(true);
		fetchMembers(true);
		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		const fetchRoles = () => {
			if (isGroupChat(state.room)) {
				return;
			}
			if (
				muteUserPermission ||
				setLeaderPermission ||
				setOwnerPermission ||
				setModeratorPermission ||
				removeUserPermission ||
				editTeamMemberPermission ||
				viewAllTeamChannelsPermission ||
				viewAllTeamsPermission
			) {
				fetchRoomMembersRoles();
			}
		};
		fetchRoles();
	}, [
		muteUserPermission,
		setLeaderPermission,
		setOwnerPermission,
		setModeratorPermission,
		removeUserPermission,
		editTeamMemberPermission,
		viewAllTeamChannelsPermission,
		viewAllTeamsPermission
	]);

	const getUserDisplayName = (user: TUserModel) => (useRealName ? user.name : user.username) || user.username;

	const handleOwner = async (selectedUser: TUserModel, isOwner: boolean) => {
		try {
			await Services.toggleRoomOwner({
				roomId: state.room.rid,
				t: state.room.t,
				userId: selectedUser._id,
				isOwner
			});
			const message = isOwner
				? 'User__username__is_now_a_owner_of__room_name_'
				: 'User__username__removed_from__room_name__owners';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: getUserDisplayName(selectedUser),
					room_name: getRoomTitle(state.room)
				})
			});
		} catch (e) {
			log(e);
		}
		fetchRoomMembersRoles();
	};

	const toggleStatus = (status: boolean) => {
		try {
			updateState({ members: [], allUsers: status, end: false });
			fetchMembers(status);
			setHeader(status);
		} catch (e) {
			log(e);
		}
	};

	const setHeader = (allUsers: boolean) => {
		navigation.setOptions({
			title: I18n.t('Members'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						iconName='filter'
						onPress={() =>
							showActionSheet({
								options: [
									{
										title: I18n.t('Online'),
										onPress: () => toggleStatus(true),
										right: () => <RadioButton check={allUsers} />,
										testID: 'room-members-view-toggle-status-online'
									},
									{
										title: I18n.t('All'),
										onPress: () => toggleStatus(false),
										right: () => <RadioButton check={!allUsers} />,
										testID: 'room-members-view-toggle-status-all'
									}
								]
							})
						}
						testID='room-members-view-filter'
					/>
				</HeaderButton.Container>
			)
		});
	};

	const handleGoRoom = (item: TGoRoomItem) => {
		if (isMasterDetail) {
			// @ts-ignore
			navigation.navigate('DrawerNavigator');
		} else {
			navigation.dispatch(StackActions.popToTop());
		}
		goRoom({ item, isMasterDetail });
	};

	const navToDirectMessage = async (item: IUser) => {
		try {
			const db = database.active;
			const subsCollection = db.get('subscriptions');
			const query = await subsCollection.query(Q.where('name', item.username)).fetch();
			if (query.length) {
				const [room] = query;
				handleGoRoom(room);
			} else {
				const result = await Services.createDirectMessage(item.username);
				if (result.success) {
					handleGoRoom({ rid: result.room?._id as string, name: item.username, t: SubscriptionType.DIRECT });
				}
			}
		} catch (e) {
			log(e);
		}
	};

	const removeFromTeam = async (selectedUser: IUser, selected?: any) => {
		try {
			const { members, room } = state;

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
				updateState({
					members: newMembers
				});
			}
		} catch (e: any) {
			log(e);
			showErrorAlert(
				e.data.error ? I18n.t(e.data.error) : I18n.t('There_was_an_error_while_action', { action: I18n.t('removing_team') }),
				I18n.t('Cannot_remove')
			);
		}
	};

	const handleRemoveFromTeam = async (selectedUser: TUserModel) => {
		try {
			const result = await Services.teamListRoomsOfUser({ teamId: state.room.teamId as string, userId: selectedUser._id });

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
						nextAction: (selected: any) => removeFromTeam(selectedUser, selected),
						showAlert: () => showErrorAlert(I18n.t('Last_owner_team_room'), I18n.t('Cannot_remove'))
					});
				} else {
					showConfirmationAlert({
						message: I18n.t('Removing_user_from_this_team', { user: selectedUser.username }),
						confirmationText: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
						onPress: () => removeFromTeam(selectedUser)
					});
				}
			}
		} catch (e) {
			showConfirmationAlert({
				message: I18n.t('Removing_user_from_this_team', { user: selectedUser.username }),
				confirmationText: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
				onPress: () => removeFromTeam(selectedUser)
			});
		}
	};

	const handleLeader = async (selectedUser: TUserModel, isLeader: boolean) => {
		try {
			await Services.toggleRoomLeader({
				roomId: state.room.rid,
				t: state.room.t,
				userId: selectedUser._id,
				isLeader
			});
			const message = isLeader
				? 'User__username__is_now_a_leader_of__room_name_'
				: 'User__username__removed_from__room_name__leaders';
			EventEmitter.emit(LISTENER, {
				message: I18n.t(message, {
					username: getUserDisplayName(selectedUser),
					room_name: getRoomTitle(state.room)
				})
			});
		} catch (e) {
			log(e);
		}
		fetchRoomMembersRoles();
	};

	const handleRemoveUserFromRoom = async (selectedUser: TUserModel) => {
		try {
			const { room, members } = state;
			const userId = selectedUser._id;
			await Services.removeUserFromRoom({ roomId: room.rid, t: room.t as RoomTypes, userId });
			const message = I18n.t('User_has_been_removed_from_s', { s: getRoomTitle(room) });
			EventEmitter.emit(LISTENER, { message });
			updateState({
				members: members.filter(member => member._id !== userId)
			});
		} catch (e) {
			log(e);
		}
	};

	const handleIgnore = async (selectedUser: TUserModel, ignore: boolean) => {
		try {
			await Services.ignoreUser({
				rid: state.room.rid,
				userId: selectedUser._id,
				ignore
			});
			const message = I18n.t(ignore ? 'User_has_been_ignored' : 'User_has_been_unignored');
			EventEmitter.emit(LISTENER, { message });
		} catch (e) {
			log(e);
		}
	};

	const handleModerator = async (selectedUser: TUserModel, isModerator: boolean) => {
		try {
			const { room } = state;
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
					username: getUserDisplayName(selectedUser),
					room_name: getRoomTitle(room)
				})
			});
		} catch (e) {
			log(e);
		}
		fetchRoomMembersRoles();
	};

	const handleMute = async (user: TUserModel) => {
		try {
			await Services.toggleMuteUserInRoom(state.room.rid, user?.username, !user?.muted);
			EventEmitter.emit(LISTENER, {
				message: I18n.t('User_has_been_key', { key: user?.muted ? I18n.t('unmuted') : I18n.t('muted') })
			});
		} catch (e) {
			log(e);
		}
	};

	const onPressUser = (selectedUser: TUserModel) => {
		const { room } = state;

		const options: TActionSheetOptionsItem[] = [
			{
				icon: 'message',
				title: I18n.t('Direct_message'),
				onPress: () => navToDirectMessage(selectedUser)
			}
		];

		// Ignore
		if (selectedUser._id !== user.id) {
			const { ignored } = room;
			const isIgnored = ignored?.includes?.(selectedUser._id);
			options.push({
				icon: 'ignore',
				title: I18n.t(isIgnored ? 'Unignore' : 'Ignore'),
				onPress: () => handleIgnore(selectedUser, !isIgnored),
				testID: 'action-sheet-ignore-user'
			});
		}

		if (muteUserPermission) {
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
						onPress: () => handleMute(selectedUser)
					});
				},
				testID: 'action-sheet-mute-user'
			});
		}

		// Owner
		if (setOwnerPermission) {
			const userRoleResult = state.roomRoles.find((r: any) => r.u._id === selectedUser._id);
			const isOwner = userRoleResult?.roles.includes('owner');
			options.push({
				icon: 'shield-check',
				title: I18n.t('Owner'),
				onPress: () => handleOwner(selectedUser, !isOwner),
				right: () => (
					<CustomIcon
						testID={isOwner ? 'action-sheet-set-owner-checked' : 'action-sheet-set-owner-unchecked'}
						name={isOwner ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={20}
						color={isOwner ? colors.tintActive : colors.auxiliaryTintColor}
					/>
				),
				testID: 'action-sheet-set-owner'
			});
		}

		// Leader
		if (setLeaderPermission) {
			const userRoleResult = state.roomRoles.find((r: any) => r.u._id === selectedUser._id);
			const isLeader = userRoleResult?.roles.includes('leader');
			options.push({
				icon: 'shield-alt',
				title: I18n.t('Leader'),
				onPress: () => handleLeader(selectedUser, !isLeader),
				right: () => (
					<CustomIcon
						testID={isLeader ? 'action-sheet-set-leader-checked' : 'action-sheet-set-leader-unchecked'}
						name={isLeader ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={20}
						color={isLeader ? colors.tintActive : colors.auxiliaryTintColor}
					/>
				),
				testID: 'action-sheet-set-leader'
			});
		}

		// Moderator
		if (setModeratorPermission) {
			const userRoleResult = state.roomRoles.find((r: any) => r.u._id === selectedUser._id);
			const isModerator = userRoleResult?.roles.includes('moderator');
			options.push({
				icon: 'shield',
				title: I18n.t('Moderator'),
				onPress: () => handleModerator(selectedUser, !isModerator),
				right: () => (
					<CustomIcon
						testID={isModerator ? 'action-sheet-set-moderator-checked' : 'action-sheet-set-moderator-unchecked'}
						name={isModerator ? 'checkbox-checked' : 'checkbox-unchecked'}
						size={20}
						color={isModerator ? colors.tintActive : colors.auxiliaryTintColor}
					/>
				),
				testID: 'action-sheet-set-moderator'
			});
		}

		// Remove from team
		if (editTeamMemberPermission) {
			options.push({
				icon: 'logout',
				danger: true,
				title: I18n.t('Remove_from_Team'),
				onPress: () => handleRemoveFromTeam(selectedUser),
				testID: 'action-sheet-remove-from-team'
			});
		}

		// Remove from room
		if (removeUserPermission && !room.teamMain) {
			options.push({
				icon: 'logout',
				title: I18n.t('Remove_from_room'),
				danger: true,
				onPress: () => {
					showConfirmationAlert({
						message: I18n.t('The_user_will_be_removed_from_s', { s: getRoomTitle(room) }),
						confirmationText: I18n.t('Yes_remove_user'),
						onPress: () => handleRemoveUserFromRoom(selectedUser)
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

	const fetchRoomMembersRoles = async () => {
		try {
			const type = state.room.t as SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.OMNICHANNEL;
			const result = await Services.getRoomRoles(state.room.rid, type);
			if (result?.success) {
				updateState({ roomRoles: result.roles });
			}
		} catch (e) {
			log(e);
		}
	};

	const fetchMembers = async (status: boolean) => {
		const { members, isLoading, end, room, filtering } = state;
		const { t } = room;
		if (isLoading || end) {
			return;
		}

		updateState({ isLoading: true });
		try {
			const membersResult = await Services.getRoomMembers({
				rid: room.rid,
				roomType: t,
				type: !status ? 'all' : 'online',
				filter: filtering,
				skip: members.length,
				limit: PAGE_SIZE,
				allUsers: !status
			});
			updateState({
				members: [...members, ...membersResult],
				isLoading: false,
				end: membersResult?.length < PAGE_SIZE
			});
		} catch (e) {
			log(e);
			updateState({ isLoading: false });
		}
	};

	const Member = React.memo(({ member }: { member: TUserModel }) => (
		<UserItem
			name={member.name as string}
			username={member.username}
			onPress={() => onPressUser(member)}
			testID={`room-members-view-item-${member.username}`}
		/>
	));

	const renderHeader = (rid: string, t: SubscriptionType) => (
		<>
			<MembersSection joined={params.joined as boolean} rid={rid} t={t} />
			<SearchBox onChangeText={text => updateState({ filter: text.trim() })} testID='room-members-view-search' />
		</>
	);

	const filteredMembers =
		state.members && state.members.length > 0 && state.filter
			? state.members.filter(
					m =>
						m.username.toLowerCase().match(state.filter.toLowerCase()) || m.name?.toLowerCase().match(state.filter.toLowerCase())
			  )
			: null;

	return (
		<SafeAreaView testID='room-members-view'>
			<StatusBar />
			<FlatList
				data={filteredMembers || state.members}
				// @ts-ignore
				renderItem={({ item }) => <Member member={item} />}
				style={[styles.list, { backgroundColor: colors.backgroundColor }]}
				keyExtractor={item => item._id}
				ItemSeparatorComponent={List.Separator}
				ListHeaderComponent={renderHeader(state.room.rid, state.room.t)}
				ListFooterComponent={() => (state.isLoading ? <ActivityIndicator /> : null)}
				onEndReachedThreshold={0.1}
				onEndReached={() => fetchMembers(state.allUsers)}
				maxToRenderPerBatch={5}
				windowSize={10}
				{...scrollPersistTaps}
			/>
		</SafeAreaView>
	);
};

export default RoomMembersView;

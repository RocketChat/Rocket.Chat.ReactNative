import { Q } from '@nozbe/watermelondb';
import { Alert } from 'react-native';

import { LISTENER } from '../../containers/Toast';
import { IGetRoomRoles, IUser, SubscriptionType, TSubscriptionModel, TUserModel } from '../../definitions';
import I18n from '../../i18n';
import { getRoomTitle, showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { goRoom, TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import log from '../../lib/methods/helpers/log';
import appNavigation from '../../lib/navigation/appNavigation';
import { Services } from '../../lib/services';
import database from '../../lib/database';
import { RoomTypes } from '../../lib/methods';
import { emitErrorCreateDirectMessage } from '../../lib/methods/helpers/emitErrorCreateDirectMessage';

export type TRoomType = SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.OMNICHANNEL;

const handleGoRoom = (item: TGoRoomItem, isMasterDetail: boolean): void => {
	goRoom({ item, isMasterDetail, popToRoot: true });
};

export const fetchRole = (role: string, selectedUser: TUserModel, roomRoles?: IGetRoomRoles[]): boolean => {
	const userRoleResult = roomRoles?.find((r: any) => r.u._id === selectedUser._id);
	return !!userRoleResult?.roles.includes(role);
};

export const fetchRoomMembersRoles = async (roomType: TRoomType, rid: string, updateState: any): Promise<void> => {
	try {
		const type = roomType;
		const result = await Services.getRoomRoles(rid, type);
		if (result?.success) {
			updateState({ roomRoles: result.roles });
		}
	} catch (e) {
		log(e);
	}
};

export const handleMute = async (user: TUserModel, rid: string) => {
	try {
		await Services.toggleMuteUserInRoom(rid, user?.username, !user.muted);
		EventEmitter.emit(LISTENER, {
			message: I18n.t('User_has_been_key', { key: user?.muted ? I18n.t('unmuted') : I18n.t('muted') })
		});
	} catch (e) {
		log(e);
	}
};

export const handleModerator = async (
	selectedUser: TUserModel,
	isModerator: boolean,
	room: TSubscriptionModel,
	username: string,
	callback: () => Promise<void>
): Promise<void> => {
	try {
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
				username,
				room_name: getRoomTitle(room)
			})
		});
		callback();
	} catch (e) {
		log(e);
	}
};

export const navToDirectMessage = async (item: IUser, isMasterDetail: boolean): Promise<void> => {
	try {
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		const query = await subsCollection.query(Q.where('name', item.username)).fetch();
		if (query.length) {
			const [room] = query;
			handleGoRoom(room, isMasterDetail);
		} else {
			const result = await Services.createDirectMessage(item.username);
			if (result.success) {
				handleGoRoom({ rid: result.room?._id as string, name: item.username, t: SubscriptionType.DIRECT }, isMasterDetail);
			}
		}
	} catch (e: any) {
		emitErrorCreateDirectMessage(e?.data);
	}
};

const removeFromTeam = async (
	selectedUser: IUser,
	updateState: Function,
	room: TSubscriptionModel,
	members: TUserModel[],
	selected?: any
) => {
	try {
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
			appNavigation.navigate('RoomMembersView', { room });
		}
	} catch (e: any) {
		log(e);
		showErrorAlert(
			e.data.error ? I18n.t(e.data.error) : I18n.t('There_was_an_error_while_action', { action: I18n.t('removing_team') }),
			I18n.t('Cannot_remove')
		);
	}
};

export const handleRemoveFromTeam = async (
	selectedUser: TUserModel,
	updateState: Function,
	room: TSubscriptionModel,
	members: TUserModel[]
): Promise<void> => {
	try {
		const result = await Services.teamListRoomsOfUser({ teamId: room.teamId as string, userId: selectedUser._id });

		if (result.success) {
			if (result.rooms?.length) {
				const teamChannels = result.rooms.map((r: any) => ({
					rid: r._id,
					name: r.name,
					teamId: r.teamId,
					alert: r.isLastOwner
				}));
				appNavigation.navigate('SelectListView', {
					title: 'Remove_Member',
					infoText: 'Remove_User_Team_Channels',
					data: teamChannels,
					nextAction: (selected: any) => removeFromTeam(selectedUser, updateState, room, members, selected),
					showAlert: () => showErrorAlert(I18n.t('Last_owner_team_room'), I18n.t('Cannot_remove'))
				});
			} else {
				showConfirmationAlert({
					message: I18n.t('Removing_user_from_this_team', { user: selectedUser.username }),
					confirmationText: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
					onPress: () => removeFromTeam(selectedUser, updateState, room, members)
				});
			}
		}
	} catch (e) {
		showConfirmationAlert({
			message: I18n.t('Removing_user_from_this_team', { user: selectedUser.username }),
			confirmationText: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
			onPress: () => removeFromTeam(selectedUser, updateState, room, members)
		});
	}
};

export const handleLeader = async (
	selectedUser: TUserModel,
	isLeader: boolean,
	room: TSubscriptionModel,
	username: string,
	callback: () => Promise<void>
): Promise<void> => {
	try {
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
				username,
				room_name: getRoomTitle(room)
			})
		});
		callback();
	} catch (e) {
		log(e);
	}
};

export const handleRemoveUserFromRoom = async (
	selectedUser: TUserModel,
	room: TSubscriptionModel,
	callback: Function
): Promise<void> => {
	try {
		const userId = selectedUser._id;
		await Services.removeUserFromRoom({ roomId: room.rid, t: room.t as RoomTypes, userId });
		const message = I18n.t('User_has_been_removed_from_s', { s: getRoomTitle(room) });
		EventEmitter.emit(LISTENER, { message });
		callback();
	} catch (e: any) {
		if (e.data && e.data.errorType === 'error-you-are-last-owner') {
			Alert.alert(I18n.t('Oops'), I18n.t(e.data.errorType));
		} else if (e?.data?.error === 'last-owner-can-not-be-removed') {
			Alert.alert(I18n.t('Oops'), I18n.t(e.data.error));
		} else {
			Alert.alert(I18n.t('Oops'), I18n.t('There_was_an_error_while_action', { action: I18n.t('leaving_room') }));
		}
		log(e);
	}
};

export const handleOwner = async (
	selectedUser: TUserModel,
	isOwner: boolean,
	username: string,
	room: TSubscriptionModel,
	callback: Function
): Promise<void> => {
	try {
		await Services.toggleRoomOwner({
			roomId: room.rid,
			t: room.t,
			userId: selectedUser._id,
			isOwner
		});
		const message = isOwner ? 'User__username__is_now_a_owner_of__room_name_' : 'User__username__removed_from__room_name__owners';
		EventEmitter.emit(LISTENER, {
			message: I18n.t(message, {
				username,
				room_name: getRoomTitle(room)
			})
		});
	} catch (e) {
		log(e);
	}
	callback();
};

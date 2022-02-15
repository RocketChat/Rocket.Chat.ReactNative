import sdk from './sdk';
import { TEAM_TYPE } from '../../../definitions/ITeam';
import roomTypeToApiType, { RoomTypes } from '../methods/roomTypeToApiType';

export const createChannel = ({
	name,
	users,
	type,
	readOnly,
	broadcast,
	encrypted,
	teamId
}: {
	name: string;
	users: string[];
	type: boolean;
	readOnly: boolean;
	broadcast: boolean;
	encrypted: boolean;
	teamId: string;
}): any => {
	const params = {
		name,
		members: users,
		readOnly,
		extraData: {
			broadcast,
			encrypted,
			...(teamId && { teamId })
		}
	};
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post(type ? 'groups.create' : 'channels.create', params);
};

export const e2eSetUserPublicAndPrivateKeys = (public_key: string, private_key: string) =>
	// RC 2.2.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('e2e.setUserPublicAndPrivateKeys', { public_key, private_key });

export const e2eRequestSubscriptionKeys = () =>
	// RC 0.72.0
	sdk.methodCallWrapper('e2e.requestSubscriptionKeys');

export const e2eGetUsersOfRoomWithoutKey = (rid: string) =>
	// RC 0.70.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.get('e2e.getUsersOfRoomWithoutKey', { rid });

export const e2eSetRoomKeyID = (rid: string, keyID: string) =>
	// RC 0.70.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('e2e.setRoomKeyID', { rid, keyID });

export const e2eUpdateGroupKey = (uid: string, rid: string, key: string) =>
	// RC 0.70.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('e2e.updateGroupKey', { uid, rid, key });

export const e2eRequestRoomKey = (rid: string, e2eKeyId: string) =>
	// RC 0.70.0
	sdk.methodCallWrapper('stream-notify-room-users', `${rid}/e2ekeyRequest`, rid, e2eKeyId);

export const updateJitsiTimeout = (roomId: string) =>
	// RC 0.74.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('video-conference/jitsi.update-timeout', { roomId });

export const register = (credentials: any) =>
	// RC 0.50.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('users.register', credentials);

export const forgotPassword = (email: string) =>
	// RC 0.64.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('users.forgotPassword', { email });

export const sendConfirmationEmail = (email: string) => sdk.methodCallWrapper('sendConfirmationEmail', email);

export const spotlight = (search: string, usernames: string, type: { users: boolean; rooms: boolean }) =>
	// RC 0.51.0
	sdk.methodCallWrapper('spotlight', search, usernames, type);

export const createDirectMessage = (username: string) =>
	// RC 0.59.0
	sdk.post('im.create', { username });

export const createDiscussion = ({
	prid,
	pmid,
	t_name,
	reply,
	users,
	encrypted
}: {
	prid: string;
	pmid?: string;
	t_name: string;
	reply?: string;
	users?: string[];
	encrypted?: boolean;
}) =>
	// RC 1.0.0
	sdk.post('rooms.createDiscussion', {
		prid,
		pmid,
		t_name,
		reply,
		users,
		encrypted
	});

export const getDiscussions = ({
	roomId,
	offset,
	count,
	text
}: {
	roomId: string | undefined;
	text?: string | undefined;
	offset: number;
	count: number;
}) => {
	const params = {
		roomId,
		offset,
		count,
		...(text && { text })
	};
	// RC 2.4.0
	return sdk.get('chat.getDiscussions', params);
};

export const createTeam = ({
	name,
	users,
	type,
	readOnly,
	broadcast,
	encrypted
}: {
	name: string;
	users: string[];
	type: boolean;
	readOnly: boolean;
	broadcast: boolean;
	encrypted: boolean;
}) => {
	const params = {
		name,
		users,
		type: type ? TEAM_TYPE.PRIVATE : TEAM_TYPE.PUBLIC,
		room: {
			readOnly,
			extraData: {
				broadcast,
				encrypted
			}
		}
	};
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post('teams.create', params);
};
export const addRoomsToTeam = ({ teamId, rooms }: { teamId: string; rooms: string[] }) =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('teams.addRooms', { teamId, rooms });

export const removeTeamRoom = ({ roomId, teamId }: { roomId: string; teamId: string }) =>
	// RC 3.13.0
	sdk.post('teams.removeRoom', { roomId, teamId });

export const leaveTeam = ({ teamId, rooms }: { teamId: string; rooms: string[] }) =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('teams.leave', {
		teamId,
		// RC 4.2.0
		...(rooms?.length && { rooms })
	});

export const removeTeamMember = ({ teamId, userId, rooms }: { teamId: string; userId: string; rooms: string[] }) =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('teams.removeMember', {
		teamId,
		userId,
		// RC 4.2.0
		...(rooms?.length && { rooms })
	});

export const updateTeamRoom = ({ roomId, isDefault }: { roomId: string; isDefault: boolean }) =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('teams.updateRoom', { roomId, isDefault });

export const deleteTeam = ({ teamId, roomsToRemove }: { teamId: string; isDefault: boolean }) =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('teams.delete', { teamId, roomsToRemove });

export const teamListRoomsOfUser = ({ teamId, userId }: { teamId: string; userId: string }) =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.get('teams.listRoomsOfUser', { teamId, userId });

export const getTeamInfo = ({ teamId }: { teamId: string }) =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.get('teams.info', { teamId });

export const convertChannelToTeam = ({ rid, name, type }: { rid: string; name: string; type: 'c' | 'p' }) => {
	const params = {
		...(type === 'c'
			? {
					channelId: rid,
					channelName: name
			  }
			: {
					roomId: rid,
					roomName: name
			  })
	};
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post(type === 'c' ? 'channels.convertToTeam' : 'groups.convertToTeam', params);
};

export const convertTeamToChannel = ({ teamId, selected }: { teamId: string; selected: string[] }) => {
	const params = {
		teamId,
		...(selected.length && { roomsToRemove: selected })
	};
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post('teams.convertToChannel', params);
};

export const joinRoom = (roomId: string, joinCode: string, type: 'c' | 'p') => {
	// TODO: join code
	// RC 0.48.0
	if (type === 'p') {
		return sdk.methodCallWrapper('joinRoom', roomId);
	}
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post('channels.join', { roomId, joinCode });
};

export const deleteMessage = (messageId: string, rid: string) =>
	// RC 0.48.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('chat.delete', { msgId: messageId, roomId: rid });

export const markAsUnread = ({ messageId }: { messageId: string }) =>
	// RC 0.65.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('subscriptions.unread', { firstUnreadMessage: { _id: messageId } });

export const toggleStarMessage = (messageId: string, starred: boolean) => {
	if (starred) {
		// RC 0.59.0
		// TODO: missing definitions from server
		// @ts-ignore
		return sdk.post('chat.unStarMessage', { messageId });
	}
	// RC 0.59.0
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post('chat.starMessage', { messageId });
};

export const togglePinMessage = (messageId: string, pinned: boolean) => {
	if (pinned) {
		// RC 0.59.0
		// TODO: missing definitions from server
		// @ts-ignore
		return sdk.post('chat.unPinMessage', { messageId });
	}
	// RC 0.59.0
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post('chat.pinMessage', { messageId });
};

export const reportMessage = (messageId: string) =>
	// RC 0.64.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('chat.reportMessage', { messageId, description: 'Message reported by user' });

export const setUserPreferences = (userId: string, data: any) =>
	// RC 0.62.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('users.setPreferences', { userId, data });

export const setUserStatus = (status: string, message: string) =>
	// RC 1.2.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('users.setStatus', { status, message });

export const setReaction = (emoji: string, messageId: string) =>
	// RC 0.62.2
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('chat.react', { emoji, messageId });

export const toggleRead = (read: boolean, roomId: string) => {
	if (read) {
		// TODO: missing definitions from server
		// @ts-ignore
		return sdk.post('subscriptions.unread', { roomId });
	}
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post('subscriptions.read', { rid: roomId });
};

export const getUserRoles = () =>
	// RC 0.27.0
	sdk.methodCallWrapper('getUserRoles');

export const getRoomCounters = (roomId: string, t: RoomTypes) =>
	// RC 0.65.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.get(`${roomTypeToApiType(t)}.counters`, { roomId });

export const getChannelInfo = (roomId: string) =>
	// RC 0.48.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.get('channels.info', { roomId });

export const getUserPreferences = (userId: string) =>
	// RC 0.62.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.get('users.getPreferences', { userId });

export const getRoomInfo = (roomId: string) =>
	// RC 0.72.0
	sdk.get('rooms.info', { roomId });

export const getVisitorInfo = (visitorId: string) =>
	// RC 2.3.0
	sdk.get('livechat/visitors.info', { visitorId });

export const setUserPresenceAway = () => sdk.methodCall('UserPresence:away');

export const setUserPresenceOnline = () => sdk.methodCall('UserPresence:online');

export const getTeamListRoom = ({
	teamId,
	count,
	offset,
	type,
	filter
}: {
	teamId: string;
	count: number;
	offset: number;
	type: string;
	filter: any;
}) => {
	const params: any = {
		teamId,
		count,
		offset,
		type
	};

	if (filter) {
		params.filter = filter;
	}
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.get('teams.listRooms', params);
};

export const closeLivechat = (rid: string, comment: string) =>
	// RC 0.29.0
	sdk.methodCallWrapper('livechat:closeRoom', rid, comment, { clientAction: true });

export const editLivechat = (userData: any, roomData: any) =>
	// RC 0.55.0
	sdk.methodCallWrapper('livechat:saveInfo', userData, roomData);

export const returnLivechat = (rid: string) =>
	// RC 0.72.0
	sdk.methodCallWrapper('livechat:returnAsInquiry', rid);

export const forwardLivechat = (transferData: any) =>
	// RC 0.36.0
	sdk.methodCallWrapper('livechat:transfer', transferData);

export const getDepartmentInfo = (departmentId: string) =>
	// RC 2.2.0
	sdk.get(`livechat/department/${departmentId}?includeAgents=false`);

export const getDepartments = () =>
	// RC 2.2.0
	sdk.get('livechat/department');

export const usersAutoComplete = (selector: any) =>
	// RC 2.4.0
	sdk.get('users.autocomplete', { selector });

export const getRoutingConfig = () =>
	// RC 2.0.0
	sdk.methodCallWrapper('livechat:getRoutingConfig');

export const getTagsList = () =>
	// RC 2.0.0
	sdk.methodCallWrapper('livechat:getTagsList');

export const getAgentDepartments = (uid: string) =>
	// RC 2.4.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.get(`livechat/agents/${uid}/departments?enabledDepartmentsOnly=true`);

export const getCustomFields = () =>
	// RC 2.2.0
	sdk.get('livechat/custom-fields');

export const getListCannedResponse = ({ scope = '', departmentId = '', offset = 0, count = 25, text = '' }) => {
	const params = {
		offset,
		count,
		...(departmentId && { departmentId }),
		...(text && { text }),
		...(scope && { scope })
	};

	// RC 3.17.0
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.get('canned-responses', params);
};

export const toggleBlockUser = (rid: string, blocked: string, block: boolean) => {
	if (block) {
		// RC 0.49.0
		return sdk.methodCallWrapper('blockUser', { rid, blocked });
	}
	// RC 0.49.0
	return sdk.methodCallWrapper('unblockUser', { rid, blocked });
};

export const leaveRoom = (roomId: string, t: RoomTypes) =>
	// RC 0.48.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post(`${roomTypeToApiType(t)}.leave`, { roomId });

export const deleteRoom = (roomId: string, t: RoomTypes) =>
	// RC 0.49.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post(`${roomTypeToApiType(t)}.delete`, { roomId });

export const toggleMuteUserInRoom = (rid: string, username: string, mute: boolean) => {
	if (mute) {
		// RC 0.51.0
		return sdk.methodCallWrapper('muteUserInRoom', { rid, username });
	}
	// RC 0.51.0
	return sdk.methodCallWrapper('unmuteUserInRoom', { rid, username });
};

export const toggleRoomOwner = ({
	roomId,
	t,
	userId,
	isOwner
}: {
	roomId: string;
	t: RoomTypes;
	userId: string;
	isOwner: boolean;
}) => {
	if (isOwner) {
		// RC 0.49.4
		// TODO: missing definitions from server
		// @ts-ignore
		return sdk.post(`${roomTypeToApiType(t)}.addOwner`, { roomId, userId });
	}
	// RC 0.49.4
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post(`${roomTypeToApiType(t)}.removeOwner`, { roomId, userId });
};

export const toggleRoomLeader = ({
	roomId,
	t,
	userId,
	isLeader
}: {
	roomId: string;
	t: RoomTypes;
	userId: string;
	isLeader: boolean;
}) => {
	if (isLeader) {
		// RC 0.58.0
		// TODO: missing definitions from server
		// @ts-ignore
		return sdk.post(`${roomTypeToApiType(t)}.addLeader`, { roomId, userId });
	}
	// RC 0.58.0
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post(`${roomTypeToApiType(t)}.removeLeader`, { roomId, userId });
};

export const toggleRoomModerator = ({
	roomId,
	t,
	userId,
	isModerator
}: {
	roomId: string;
	t: RoomTypes;
	userId: string;
	isModerator: boolean;
}) => {
	if (isModerator) {
		// RC 0.49.4
		// TODO: missing definitions from server
		// @ts-ignore
		return sdk.post(`${roomTypeToApiType(t)}.addModerator`, { roomId, userId });
	}
	// RC 0.49.4
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post(`${roomTypeToApiType(t)}.removeModerator`, { roomId, userId });
};

export const removeUserFromRoom = ({ roomId, t, userId }: { roomId: string; t: RoomTypes; userId: string }) =>
	// RC 0.48.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post(`${roomTypeToApiType(t)}.kick`, { roomId, userId });

export const ignoreUser = ({ rid, userId, ignore }: { rid: string; userId: string; ignore: boolean }) =>
	// RC 0.64.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.get('chat.ignoreUser', { rid, userId, ignore });

export const toggleArchiveRoom = (roomId: string, t: RoomTypes, archive: boolean) => {
	if (archive) {
		// RC 0.48.0
		// TODO: missing definitions from server
		// @ts-ignore
		return sdk.post(`${roomTypeToApiType(t)}.archive`, { roomId });
	}
	// RC 0.48.0
	// TODO: missing definitions from server
	// @ts-ignore
	return sdk.post(`${roomTypeToApiType(t)}.unarchive`, { roomId });
};

export const hideRoom = (roomId: string, t: RoomTypes) =>
	// RC 0.48.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post(`${roomTypeToApiType(t)}.close`, { roomId });

export const saveRoomSettings = (rid: string, params: any) =>
	// RC 0.55.0
	sdk.methodCallWrapper('saveRoomSettings', rid, params);

export const saveUserProfile = (data: any, customFields: any) =>
	// RC 0.62.2
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('users.updateOwnBasicInfo', { data, customFields });

export const saveUserPreferences = (data: any) =>
	// RC 0.62.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('users.setPreferences', { data });

export const saveNotificationSettings = (roomId: string, notifications: any) =>
	// RC 0.63.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('rooms.saveNotification', { roomId, notifications });

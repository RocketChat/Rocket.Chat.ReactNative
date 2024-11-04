import type { IPushTokenTypes } from '@rocket.chat/core-typings';

import {
	IAvatarSuggestion,
	IMessage,
	IPreviewItem,
	IProfileParams,
	IRoom,
	IServerRoom,
	IUser,
	RoomType,
	SubscriptionType
} from '../../definitions';
import { ILivechatTag } from '../../definitions/ILivechatTag';
import { ISpotlight } from '../../definitions/ISpotlight';
import { TEAM_TYPE } from '../../definitions/ITeam';
import { Encryption } from '../encryption';
import { RoomTypes, roomTypeToApiType, unsubscribeRooms } from '../methods';
import { compareServerVersion, getBundleId, isIOS } from '../methods/helpers';
import { getDeviceToken } from '../notifications';
import { store as reduxStore } from '../store/auxStore';
import sdk from './sdk';

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
}) => {
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
	return sdk.post(type ? '/v1/groups.create' : '/v1/channels.create', params);
};

export const e2eSetUserPublicAndPrivateKeys = (public_key: string, private_key: string, force: boolean = false) =>
	// RC 2.2.0
	sdk.post('/v1/e2e.setUserPublicAndPrivateKeys', { public_key, private_key, ...(force && { force: true }) });

export const e2eRequestSubscriptionKeys = (): Promise<boolean> =>
	// RC 0.72.0
	sdk.methodCallWrapper('e2e.requestSubscriptionKeys');

export const e2eGetUsersOfRoomWithoutKey = (rid: string) =>
	// RC 0.70.0
	sdk.get('/v1/e2e.getUsersOfRoomWithoutKey', { rid });

export const e2eSetRoomKeyID = (rid: string, keyID: string) =>
	// RC 0.70.0
	sdk.post('/v1/e2e.setRoomKeyID', { rid, keyID });

export const e2eUpdateGroupKey = (uid: string, rid: string, key: string) =>
	// RC 0.70.0
	sdk.post('/v1/e2e.updateGroupKey', { uid, rid, key });

export const e2eRequestRoomKey = (rid: string, e2eKeyId: string): Promise<any> =>
	// RC 0.70.0
	sdk.methodCall('stream-notify-room-users', `${rid}/e2ekeyRequest`, rid, e2eKeyId);

export const e2eAcceptSuggestedGroupKey = (rid: string) =>
	// RC 5.5
	sdk.post('/v1/e2e.acceptSuggestedGroupKey', { rid });

export const e2eRejectSuggestedGroupKey = (rid: string) =>
	// RC 5.5
	sdk.post('/v1/e2e.rejectSuggestedGroupKey', { rid });

export const updateJitsiTimeout = (roomId: string) =>
	// RC 0.74.0
	// @ts-ignore TODO: does this exist?
	sdk.post('/v1/video-conference/jitsi.update-timeout', { roomId });

export const register = (credentials: { name: string; email: string; pass: string; username: string }) =>
	// RC 0.50.0
	sdk.post('/v1/users.register', credentials);

export const forgotPassword = (email: string) =>
	// RC 0.64.0
	sdk.post('/v1/users.forgotPassword', { email });

export const sendConfirmationEmail = (email: string): Promise<{ message: string; success: boolean }> =>
	sdk.methodCallWrapper('sendConfirmationEmail', email);

export const spotlight = (
	search: string,
	usernames: string[],
	type: { users: boolean; rooms: boolean },
	rid?: string
): Promise<ISpotlight> =>
	// RC 0.51.0
	rid
		? sdk.methodCallWrapper('spotlight', search, usernames, type, rid)
		: sdk.methodCallWrapper('spotlight', search, usernames, type);

// export const createDirectMessage = (username: string) =>
// 	// RC 0.59.0
// 	sdk.post('/v1/im.create', { username });

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
	sdk.post('/v1/rooms.createDiscussion', {
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
	roomId: string;
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
	return sdk.get('/v1/chat.getDiscussions', params);
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
		members: users,
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
	return sdk.post('/v1/teams.create', params);
};
// export const addRoomsToTeam = ({ teamId, rooms }: { teamId: string; rooms: string[] }) =>
// 	// RC 3.13.0
// 	sdk.post('/v1/teams.addRooms', { teamId, rooms });

// export const removeTeamRoom = ({ roomId, teamId }: { roomId: string; teamId: string }) =>
// 	// RC 3.13.0
// 	sdk.post('/v1/teams.removeRoom', { roomId, teamId });

export const leaveTeam = ({ teamId, rooms }: { teamId: string; rooms: string[] }): any =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('/v1/teams.leave', {
		teamId,
		// RC 4.2.0
		...(rooms?.length && { rooms })
	});

// export const removeTeamMember = ({ teamId, userId, rooms }: { teamId: string; userId: string; rooms: string[] }) =>
// RC 3.13.0
// sdk.post('/v1/teams.removeMember', {
// 	teamId,
// 	userId,
// 	// RC 4.2.0
// 	...(rooms?.length && { rooms })
// });

// export const updateTeamRoom = ({ roomId, isDefault }: { roomId: string; isDefault: boolean }) =>
// 	// RC 3.13.0
// 	sdk.post('/v1/teams.updateRoom', { roomId, isDefault });

export const deleteTeam = ({ teamId, roomsToRemove }: { teamId: string; roomsToRemove: string[] }): any =>
	// RC 3.13.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('/v1/teams.delete', { teamId, roomsToRemove });

// export const teamListRoomsOfUser = ({ teamId, userId }: { teamId: string; userId: string }) =>
// 	// RC 3.13.0
// 	sdk.get('/v1/teams.listRoomsOfUser', { teamId, userId });

export const convertChannelToTeam = ({ rid, name, type }: { rid: string; name: string; type: 'c' | 'p' }) => {
	const serverVersion = reduxStore.getState().server.version;
	if (type === 'c') {
		// https://github.com/RocketChat/Rocket.Chat/pull/25279
		const params = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '4.8.0')
			? { channelId: rid }
			: {
					channelId: rid,
					channelName: name
			  };
		// @ts-ignore Backwards compatibility breaking ts
		return sdk.post('/v1/channels.convertToTeam', params);
	}
	const params = {
		roomId: rid,
		roomName: name
	};
	return sdk.post('/v1/groups.convertToTeam', params);
};

export const convertTeamToChannel = ({ teamId, selected }: { teamId: string; selected: string[] }) => {
	const params = {
		teamId,
		...(selected.length && { roomsToRemove: selected })
	};
	return sdk.post('/v1/teams.convertToChannel', params);
};

export const joinRoom = (roomId: string, joinCode: string | undefined, type: 'c' | 'p') => {
	// RC 0.48.0
	if (type === 'p') {
		return sdk.methodCallWrapper('joinRoom', roomId) as Promise<boolean>;
	}
	return sdk.post('/v1/channels.join', { roomId, joinCode });
};

export const deleteMessage = (messageId: string, rid: string) =>
	// RC 0.48.0
	sdk.post('/v1/chat.delete', { msgId: messageId, roomId: rid });

// export const markAsUnread = ({ messageId }: { messageId: string }) =>
// 	// RC 0.65.0
// 	sdk.post('/v1/subscriptions.unread', { firstUnreadMessage: { _id: messageId } });

export const toggleStarMessage = (messageId: string, starred?: boolean) => {
	if (starred) {
		// RC 0.59.0
		return sdk.post('/v1/chat.unStarMessage', { messageId });
	}
	// RC 0.59.0
	return sdk.post('/v1/chat.starMessage', { messageId });
};

export const togglePinMessage = (messageId: string, pinned?: boolean) => {
	if (pinned) {
		// RC 0.59.0
		return sdk.post('/v1/chat.unPinMessage', { messageId });
	}
	// RC 0.59.0
	return sdk.post('/v1/chat.pinMessage', { messageId });
};

export const reportUser = (userId: string, description: string) =>
	// RC 6.4.0
	sdk.post('/v1/moderation.reportUser', { userId, description });

export const reportMessage = (messageId: string) =>
	// RC 0.64.0
	sdk.post('/v1/chat.reportMessage', { messageId, description: 'Message reported by user' });

// export const setUserPreferences = (userId: string, data: Partial<INotificationPreferences>) =>
// 	// RC 0.62.0
// 	sdk.post('/v1/users.setPreferences', { userId, data });

export const setUserStatus = (status: string, message: string) =>
	// RC 1.2.0
	sdk.methodCallWrapper('setUserStatus', status, message);

export const setReaction = (emoji: string, messageId: string) =>
	// RC 0.62.2
	sdk.post('/v1/chat.react', { emoji, messageId });

export const toggleReadStatus = (isRead: boolean, roomId: string, includeThreads?: boolean) => {
	if (isRead) {
		return sdk.post('/v1/subscriptions.unread', { roomId });
	}
	const payload: any = { rid: roomId };
	if (includeThreads) {
		payload.readThreads = includeThreads;
	}

	return sdk.post('/v1/subscriptions.read', payload);
};

export const getRoomCounters = (
	roomId: string,
	t: SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.OMNICHANNEL
) =>
	// RC 0.65.0
	sdk.get(`/v1/${roomTypeToApiType(t)}.counters`, { roomId });

export const getChannelInfo = (roomId: string) =>
	// RC 0.48.0
	sdk.get('/v1/channels.info', { roomId });

// export const getRoomInfo = (roomId: string) =>
// 	// RC 0.72.0
// 	sdk.get('/v1/rooms.info', { roomId });

export const getRoomByTypeAndName = (roomType: RoomType, roomName: string): Promise<IServerRoom> =>
	sdk.methodCallWrapper('getRoomByTypeAndName', roomType, roomName);

// export const getVisitorInfo = (visitorId: string) =>
// 	// RC 2.3.0
// 	sdk.get('/v1/livechat/visitors.info', { visitorId });

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
	return sdk.get('/v1/teams.listRooms', params);
};

export const closeLivechat = (rid: string, comment?: string, tags?: string[]) => {
	// RC 3.2.0
	let params;
	if (tags && tags?.length) {
		params = { tags };
	}
	// RC 0.29.0
	return sdk.methodCallWrapper('livechat:closeRoom', rid, comment, { clientAction: true, ...params });
};

export const returnLivechat = (rid: string): Promise<boolean> =>
	// RC 0.72.0
	sdk.methodCallWrapper('livechat:returnAsInquiry', rid);

export const onHoldLivechat = (roomId: string) => sdk.post('/v1/livechat/room.onHold', { roomId });

export const forwardLivechat = (transferData: any) =>
	// RC 0.36.0
	sdk.methodCallWrapper('livechat:transfer', transferData);

// export const getDepartmentInfo = (departmentId: string) =>
// 	// RC 2.2.0
// 	// @ts-ignore
// 	sdk.get(`/v1/livechat/department/${departmentId}?includeAgents=false`);

export const getDepartments = (args?: { count: number; offset: number; text: string }) => {
	let params;
	if (args) {
		params = {
			text: args.text,
			count: args.count,
			offset: args.offset
		};
	}
	// RC 2.2.0
	return sdk.get('/v1/livechat/department', params);
};

export const usersAutoComplete = (selector: any) =>
	// RC 2.4.0
	sdk.get('/v1/users.autocomplete', { selector });

export const getRoutingConfig = (): Promise<{
	previewRoom: boolean;
	showConnecting: boolean;
	showQueue: boolean;
	showQueueLink: boolean;
	returnQueue: boolean;
	enableTriggerAction: boolean;
	autoAssignAgent: boolean;
}> =>
	// RC 2.0.0
	sdk.methodCallWrapper('livechat:getRoutingConfig');

export const getTagsList = (): Promise<ILivechatTag[]> =>
	// RC 2.0.0
	sdk.methodCallWrapper('livechat:getTagsList');

export const getAgentDepartments = (uid: string) =>
	// RC 2.4.0
	sdk.get(`/v1/livechat/agents/${uid}/departments`, { enabledDepartmentsOnly: 'true' });

export const getCustomFields = () =>
	// RC 2.2.0
	sdk.get('/v1/livechat/custom-fields');

export const getListCannedResponse = ({ scope = '', departmentId = '', offset = 0, count = 25, text = '' }) => {
	const params = {
		offset,
		count,
		...(departmentId && { departmentId }),
		...(text && { text }),
		...(scope && { scope })
	};

	// RC 3.17.0
	return sdk.get('/v1/canned-responses', params);
};

export const toggleBlockUser = (rid: string, blocked: string, block: boolean): Promise<boolean> => {
	if (block) {
		// RC 0.49.0
		return sdk.methodCallWrapper('blockUser', { rid, blocked });
	}
	// RC 0.49.0
	return sdk.methodCallWrapper('unblockUser', { rid, blocked });
};

export const leaveRoom = (roomId: string, t: RoomTypes) =>
	// RC 0.48.0
	sdk.post(`/v1/${roomTypeToApiType(t)}.leave`, { roomId });

export const deleteRoom = (roomId: string, t: RoomTypes) =>
	// RC 0.49.0
	sdk.post(`/v1/${roomTypeToApiType(t)}.delete`, { roomId });

export const toggleMuteUserInRoom = (
	rid: string,
	username: string,
	mute: boolean
): Promise<{ message: { msg: string; result: boolean }; success: boolean }> => {
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
	t: SubscriptionType;
	userId: string;
	isOwner: boolean;
}) => {
	const type = t as SubscriptionType.CHANNEL;
	if (isOwner) {
		// RC 0.49.4
		return sdk.post(`/v1/${roomTypeToApiType(type)}.addOwner`, { roomId, userId });
	}
	// RC 0.49.4
	return sdk.post(`/v1/${roomTypeToApiType(type)}.removeOwner`, { roomId, userId });
};

export const toggleRoomLeader = ({
	roomId,
	t,
	userId,
	isLeader
}: {
	roomId: string;
	t: SubscriptionType;
	userId: string;
	isLeader: boolean;
}) => {
	const type = t as SubscriptionType.CHANNEL;
	if (isLeader) {
		// RC 0.58.0
		return sdk.post(`/v1/${roomTypeToApiType(type)}.addLeader`, { roomId, userId });
	}
	// RC 0.58.0
	return sdk.post(`/v1/${roomTypeToApiType(type)}.removeLeader`, { roomId, userId });
};

export const toggleRoomModerator = ({
	roomId,
	t,
	userId,
	isModerator
}: {
	roomId: string;
	t: SubscriptionType;
	userId: string;
	isModerator: boolean;
}) => {
	const type = t as SubscriptionType.CHANNEL;
	if (isModerator) {
		// RC 0.49.4
		return sdk.post(`/v1/${roomTypeToApiType(type)}.addModerator`, { roomId, userId });
	}
	// RC 0.49.4
	return sdk.post(`/v1/${roomTypeToApiType(type)}.removeModerator`, { roomId, userId });
};

export const removeUserFromRoom = ({ roomId, t, userId }: { roomId: string; t: RoomTypes; userId: string }) =>
	// RC 0.48.0
	sdk.post(`/v1/${roomTypeToApiType(t)}.kick`, { roomId, userId });

export const ignoreUser = ({ rid, userId, ignore }: { rid: string; userId: string; ignore: string }) =>
	// RC 0.64.0
	sdk.get('/v1/chat.ignoreUser', { rid, userId, ignore });

export const toggleArchiveRoom = (roomId: string, t: SubscriptionType, archive: boolean) => {
	const type = t as SubscriptionType.CHANNEL | SubscriptionType.GROUP;
	if (archive) {
		// RC 0.48.0
		return sdk.post(`/v1/${roomTypeToApiType(type)}.archive`, { roomId });
	}
	// RC 0.48.0
	return sdk.post(`/v1/${roomTypeToApiType(type)}.unarchive`, { roomId });
};

// export const hideRoom = (roomId: string, t: RoomTypes) =>
// 	// RC 0.48.0
// 	sdk.post(`/v1/${roomTypeToApiType(t)}.close`, { roomId });

export const saveRoomSettings = (
	rid: string,
	params: {
		roomName?: string;
		roomAvatar?: string | null;
		roomDescription?: string;
		roomTopic?: string;
		roomAnnouncement?: string;
		roomType?: SubscriptionType;
		readOnly?: boolean;
		reactWhenReadOnly?: boolean;
		systemMessages?: string[];
		joinCode?: string;
		encrypted?: boolean;
	}
): Promise<{ result: boolean; rid: string }> =>
	// RC 0.55.0
	sdk.methodCallWrapper('saveRoomSettings', rid, params);

export const getSingleMessage = (msgId: string) =>
	// RC 0.47.0
	sdk.get('/v1/chat.getMessage', { msgId });

export const getRoomRoles = (
	roomId: string,
	type: SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.OMNICHANNEL
) =>
	// RC 0.65.0
	sdk.get(`/v1/${roomTypeToApiType(type)}.roles`, { roomId });

export const getAvatarSuggestion = (): Promise<{ [service: string]: IAvatarSuggestion }> =>
	// RC 0.51.0
	sdk.methodCallWrapper('getAvatarSuggestion');

export const resetAvatar = (userId: string) =>
	// RC 0.55.0
	sdk.post('/v1/users.resetAvatar', { userId });

export const setAvatarFromService = ({
	data,
	contentType = '',
	service = null
}: {
	data: any;
	contentType?: string;
	service?: string | null;
}): Promise<void> =>
	// RC 0.51.0
	sdk.methodCallWrapper('setAvatarFromService', data, contentType, service);

// export const getUsernameSuggestion = () =>
// 	// RC 0.65.0
// 	sdk.get('/v1/users.getUsernameSuggestion');

export const getFiles = (roomId: string, type: SubscriptionType, offset: number) => {
	const t = type as SubscriptionType.DIRECT | SubscriptionType.CHANNEL | SubscriptionType.GROUP;
	// RC 0.59.0
	return sdk.get(`/v1/${roomTypeToApiType(t)}.files`, {
		roomId,
		offset,
		sort: '{"uploadedAt": -1}'
	});
};

export const getMessages = ({
	roomId,
	type,
	offset,
	starredIds,
	mentionIds,
	pinned
}: {
	roomId: string;
	type: SubscriptionType;
	offset: number;
	mentionIds?: string[];
	starredIds?: string[];
	pinned?: boolean;
}) => {
	const t = type as SubscriptionType.DIRECT | SubscriptionType.CHANNEL | SubscriptionType.GROUP;
	const serverVersion = reduxStore.getState().server.version;

	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')) {
		const params: any = {
			roomId,
			offset,
			sort: { ts: -1 }
		};

		if (mentionIds && mentionIds.length > 0) {
			params.mentionIds = mentionIds.join(',');
		}

		if (starredIds && starredIds.length > 0) {
			params.starredIds = starredIds.join(',');
		}

		if (pinned) {
			params.pinned = pinned;
		}

		return sdk.get(`${roomTypeToApiType(t)}.messages`, params);
	}
	const params: any = {
		roomId,
		offset,
		sort: { ts: -1 }
	};

	if (mentionIds && mentionIds.length > 0) {
		params.query = { ...params.query, 'mentions._id': { $in: mentionIds } };
	}

	if (starredIds && starredIds.length > 0) {
		params.query = { ...params.query, 'starred._id': { $in: starredIds } };
	}

	if (pinned) {
		params.query = { ...params.query, pinned: true };
	}

	// RC 0.59.0
	return sdk.get(`${roomTypeToApiType(t)}.messages`, params);
};

// export const getReadReceipts = (messageId: string) =>
// 	// RC 0.63.0
// 	sdk.get('/v1/chat.getMessageReadReceipts', {
// 		messageId
// 	});

// export const searchMessages = (roomId: string, searchText: string, count: number, offset: number) =>
// 	// RC 0.60.0
// 	sdk.get('/v1/chat.search', {
// 		roomId,
// 		searchText,
// 		count,
// 		offset
// 	});

export const toggleFollowMessage = (mid: string, follow: boolean) => {
	// RC 1.0
	if (follow) {
		return sdk.post('/v1/chat.followMessage', { mid });
	}
	return sdk.post('/v1/chat.unfollowMessage', { mid });
};

export const getSyncThreadsList = ({ rid, updatedSince }: { rid: string; updatedSince: string }) =>
	// RC 1.0
	sdk.get('/v1/chat.syncThreadsList', {
		rid,
		updatedSince
	});

export const getCommandPreview = (command: string, roomId: string, params: string) =>
	// RC 0.65.0
	sdk.get('/v1/commands.preview', {
		command,
		roomId,
		params
	});

export const executeCommandPreview = (
	command: string,
	params: string,
	roomId: string,
	previewItem: IPreviewItem,
	triggerId: string,
	tmid?: string
) =>
	// RC 0.65.0
	sdk.post('/v1/commands.preview', {
		command,
		params,
		roomId,
		previewItem,
		triggerId,
		tmid
	});

export const getDirectory = ({
	query,
	count,
	offset,
	sort
}: {
	query: any;
	count: number;
	offset: number;
	sort: { [key: string]: number };
}) =>
	// RC 1.0
	// @ts-ignore TODO: params changed on 7.0
	sdk.get('/v1/directory', {
		query,
		count,
		offset,
		sort
	});

export const saveAutoTranslate = ({
	rid,
	field,
	value,
	options
}: {
	rid: string;
	field: string;
	value: string;
	options?: { defaultLanguage: string };
}) => sdk.methodCallWrapper('autoTranslate.saveSettings', rid, field, value, options ?? null);

export const getSupportedLanguagesAutoTranslate = (): Promise<{ language: string; name: string }[]> =>
	sdk.methodCallWrapper('autoTranslate.getSupportedLanguages', 'en');

export const translateMessage = (messageId: string, targetLanguage: string) =>
	sdk.post('/v1/autotranslate.translateMessage', { messageId, targetLanguage });

export const findOrCreateInvite = ({ rid, days, maxUses }: { rid: string; days: number; maxUses: number }): any =>
	// RC 2.4.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('/v1/findOrCreateInvite', { rid, days, maxUses });

export const validateInviteToken = (token: string): any =>
	// RC 2.4.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('/v1/validateInviteToken', { token });

export const inviteToken = (token: string): any =>
	// RC 2.4.0
	// TODO: missing definitions from server
	// @ts-ignore
	sdk.post('/v1/useInviteToken', { token });

export const readThreads = (tmid: string): Promise<void> => {
	const serverVersion = reduxStore.getState().server.version;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.4.0')) {
		// RC 3.4.0
		return sdk.methodCallWrapper('readThreads', tmid);
	}
	return Promise.resolve();
};

export const createGroupChat = () => {
	const { users } = reduxStore.getState().selectedUsers;
	const usernames = users.map(u => u.name).join(',');

	// RC 3.1.0
	return sdk.post('/v1/im.create', { usernames });
};

export const addUsersToRoom = (rid: string): Promise<boolean> => {
	const { users: selectedUsers } = reduxStore.getState().selectedUsers;
	const users = selectedUsers.map(u => u.name);
	// RC 0.51.0
	return sdk.methodCallWrapper('addUsersToRoom', { rid, users });
};

export const emitTyping = (room: IRoom, typing = true) => {
	const { login, settings, server } = reduxStore.getState();
	const { UI_Use_Real_Name } = settings;
	const { version: serverVersion } = server;
	const { user } = login;
	const name = UI_Use_Real_Name ? user.name : user.username;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '4.0.0')) {
		return sdk.methodCall('stream-notify-room', `${room}/user-activity`, name, typing ? ['user-typing'] : []);
	}
	return sdk.methodCall('stream-notify-room', `${room}/typing`, name, typing);
};

export function e2eResetOwnKey(): Promise<boolean | {}> {
	// {} when TOTP is enabled
	unsubscribeRooms();

	// RC 0.72.0
	return sdk.methodCallWrapper('e2e.resetOwnE2EKey');
}

export const editMessage = async (message: Pick<IMessage, 'id' | 'msg' | 'rid'>) => {
	const { rid, msg } = await Encryption.encryptMessage(message as IMessage);
	// RC 0.49.0
	return sdk.post('/v1/chat.update', { roomId: rid, msgId: message.id, text: msg, customFields: {} }); // TODO: customFields required on ChatUpdate? why?
};

export const registerPushToken = () =>
	new Promise<void>(async resolve => {
		const token = getDeviceToken();
		if (token) {
			const type: IPushTokenTypes = isIOS ? 'apn' : 'gcm';
			const data = {
				value: token,
				type,
				appName: getBundleId
			};
			try {
				// RC 0.60.0
				await sdk.post('/v1/push.token', data);
			} catch (error) {
				console.log(error);
			}
		}
		return resolve();
	});

export const removePushToken = async (): Promise<boolean | void> => {
	const token = getDeviceToken();
	if (token) {
		// RC 0.60.0
		await sdk.delete('/v1/push.token', { token });
	}
	return Promise.resolve();
};

// RC 6.6.0
// export const pushTest = () => sdk.post('/v1/push.test');

// RC 6.5.0
export const pushInfo = () => sdk.get('/v1/push.info');

export const sendEmailCode = () => {
	const { username } = reduxStore.getState().login.user as IUser;
	// RC 3.1.0
	return sdk.post('/v1/users.2fa.sendEmailCode', { emailOrUsername: username });
};

export const getRoomMembers = async ({
	rid,
	allUsers,
	roomType,
	type,
	filter,
	skip = 0,
	limit = 10
}: {
	rid: string;
	allUsers: boolean;
	type: 'all' | 'online';
	roomType: SubscriptionType;
	filter: string;
	skip: number;
	limit: number;
}) => {
	const t = roomType as SubscriptionType.CHANNEL | SubscriptionType.GROUP | SubscriptionType.DIRECT;
	const serverVersion = reduxStore.getState().server.version;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.16.0')) {
		const params = {
			roomId: rid,
			offset: skip,
			count: limit,
			...(type !== 'all' && { 'status[]': type }),
			...(filter && { filter })
		};
		// RC 3.16.0
		const result = await sdk.get(`/v1/${roomTypeToApiType(t)}.members`, params);
		if (result) {
			return result?.members;
		}
	}
	// RC 0.42.0
	const result = await sdk.methodCallWrapper('getUsersOfRoom', rid, allUsers, { skip, limit });
	return result?.records;
};

export const e2eFetchMyKeys = async () => {
	// RC 0.70.0
	const result = await sdk.get('/v1/e2e.fetchMyKeys');
	// snake_case -> camelCase
	if (result) {
		return {
			success: true,
			publicKey: result.public_key,
			privateKey: result.private_key
		};
	}
	return result;
};

export const logoutOtherLocations = () => sdk.post('/v1/users.removeOtherTokens');

// export function getUserInfo(userId: string) {
// 	// RC 0.48.0
// 	return sdk.get('/v1/users.info', { userId });
// }

// export const toggleFavorite = (roomId: string, favorite: boolean) => sdk.post('/v1/rooms.favorite', { roomId, favorite });

export const videoConferenceJoin = (callId: string, cam?: boolean, mic?: boolean) =>
	sdk.post('/v1/video-conference.join', { callId, state: { cam: !!cam, mic: mic === undefined ? true : mic } });

export const videoConferenceGetCapabilities = () => sdk.get('/v1/video-conference.capabilities');

export const videoConferenceStart = (roomId: string) => sdk.post('/v1/video-conference.start', { roomId, allowRinging: true });

export const videoConferenceCancel = (callId: string) => sdk.post('/v1/video-conference.cancel', { callId });

export const saveUserProfileMethod = (
	params: IProfileParams,
	customFields = {},
	twoFactorOptions: {
		twoFactorCode: string;
		twoFactorMethod: string;
	} | null
) => sdk.methodCallWrapper('saveUserProfile', params, customFields, twoFactorOptions);

export const deleteOwnAccount = (password: string, confirmRelinquish = false): any =>
	// RC 0.67.0
	sdk.post('/v1/users.deleteOwnAccount', { password, confirmRelinquish });

export const postMessage = (roomId: string, text: string) => sdk.post('/v1/chat.postMessage', { roomId, text });

export const notifyUser = (type: string, params: Record<string, any>): Promise<unknown> =>
	sdk.methodCall('stream-notify-user', type, params);

export const getUsersRoles = (): Promise<boolean> => sdk.methodCallWrapper('getUserRoles');

export const getSupportedVersionsCloud = (uniqueId?: string, domain?: string) =>
	fetch(`https://releases.rocket.chat/v2/server/supportedVersions?uniqueId=${uniqueId}&domain=${domain}&source=mobile`);

export const setUserPassword = (password: string) => sdk.methodCallWrapper('setUserPassword', password);

import EJSON from 'ejson';

import { slugifyLikeString } from '../../database/utils';
import { Encryption } from '../../encryption';
import { store as reduxStore } from '../../store/auxStore';
import findSubscriptionsRooms from './findSubscriptionsRooms';
import normalizeMessage from './normalizeMessage';
import { ISubscription, IServerSubscription, IServerRoom, IRoom, IOmnichannelRoom } from '../../../definitions';
import { compareServerVersion } from './compareServerVersion';

export const merge = (
	subscription: ISubscription | IServerSubscription,
	room?: IRoom | IServerRoom | IOmnichannelRoom
): ISubscription => {
	const serverVersion = reduxStore.getState().server.version as string;
	const mergedSubscription: ISubscription = EJSON.fromJSONValue(subscription);

	if (room) {
		room = EJSON.fromJSONValue(room);
		if (room?._updatedAt) {
			mergedSubscription.lastMessage = normalizeMessage(room.lastMessage);
			mergedSubscription.description = room.description;
			mergedSubscription.topic = room.topic;
			mergedSubscription.announcement = room.announcement;
			mergedSubscription.reactWhenReadOnly = room.reactWhenReadOnly;
			mergedSubscription.archived = room.archived || false;
			mergedSubscription.joinCodeRequired = room.joinCodeRequired;
			mergedSubscription.jitsiTimeout = room.jitsiTimeout;
			mergedSubscription.usernames = room.usernames;
			mergedSubscription.uids = room.uids;
		}

		if (compareServerVersion(serverVersion, 'lowerThan', '3.7.0')) {
			const updatedAt = room?._updatedAt ? new Date(room._updatedAt) : null;
			// @ts-ignore
			const lastMessageTs = mergedSubscription?.lastMessage?.ts ? new Date(mergedSubscription.lastMessage.ts) : null;
			// @ts-ignore
			// If all parameters are null it will return zero, if only one is null it will return its timestamp only.
			// "It works", but it's not the best solution. It does not accept "Date" as a parameter, but it works.
			mergedSubscription.roomUpdatedAt = Math.max(updatedAt, lastMessageTs);
		} else {
			// https://github.com/RocketChat/Rocket.Chat/blob/develop/app/ui-sidenav/client/roomList.js#L180
			const lastRoomUpdate = room?.lm || mergedSubscription.ts || mergedSubscription._updatedAt;
			// @ts-ignore Same as above scenario
			mergedSubscription.roomUpdatedAt = mergedSubscription.lr
				? // @ts-ignore Same as above scenario
				  Math.max(new Date(mergedSubscription.lr), new Date(lastRoomUpdate))
				: lastRoomUpdate;
		}
		mergedSubscription.ro = room?.ro ?? false;
		if (room && 'broadcast' in room) {
			mergedSubscription.broadcast = room?.broadcast;
		}
		mergedSubscription.encrypted = room?.encrypted;
		mergedSubscription.e2eKeyId = room?.e2eKeyId;
		mergedSubscription.usersWaitingForE2EKeys = room?.usersWaitingForE2EKeys;
		mergedSubscription.avatarETag = room?.avatarETag;
		mergedSubscription.teamId = room?.teamId;
		mergedSubscription.teamMain = room?.teamMain;
		if (!mergedSubscription.roles || !mergedSubscription.roles.length) {
			mergedSubscription.roles = [];
		}
		if (!mergedSubscription.ignored?.length) {
			mergedSubscription.ignored = [];
		}
		if (room?.muted?.length) {
			mergedSubscription.muted = room.muted.filter(muted => !!muted);
		} else {
			mergedSubscription.muted = [];
		}
		if (room?.unmuted?.length) {
			mergedSubscription.unmuted = room.unmuted.filter(unmuted => !!unmuted);
		} else {
			mergedSubscription.unmuted = [];
		}
		if (room?.v) {
			mergedSubscription.visitor = room.v;
		}
		if (room?.departmentId) {
			mergedSubscription.departmentId = room.departmentId;
		}
		if (room?.servedBy) {
			mergedSubscription.servedBy = room.servedBy;
		}
		if (room?.livechatData) {
			mergedSubscription.livechatData = room.livechatData;
		}
		if (room?.tags) {
			mergedSubscription.tags = room.tags;
		}
		mergedSubscription.sysMes = room?.sysMes;
		if (room && 'source' in room) {
			mergedSubscription.source = room?.source;
		}
		if (room && 'usersCount' in room) {
			mergedSubscription.usersCount = room.usersCount;
		}
	}

	if (!mergedSubscription.name) {
		mergedSubscription.name = mergedSubscription.fname as string;
	}

	if (!mergedSubscription.autoTranslate) {
		mergedSubscription.autoTranslate = false;
	}

	mergedSubscription.blocker = !!mergedSubscription.blocker;
	mergedSubscription.blocked = !!mergedSubscription.blocked;
	mergedSubscription.hideMentionStatus = !!mergedSubscription.hideMentionStatus;
	mergedSubscription.sanitizedFname = slugifyLikeString(mergedSubscription.fname || mergedSubscription.name);

	if (!mergedSubscription.E2ESuggestedKey) {
		mergedSubscription.E2ESuggestedKey = null;
	}
	return mergedSubscription;
};

export default async (
	serverSubscriptions: {
		update: IServerSubscription[];
		remove: IServerSubscription[];
		success: boolean;
	},
	serverRooms: {
		update: IServerRoom[];
		remove: IServerRoom[];
		success: boolean;
	}
): Promise<ISubscription[]> => {
	const subscriptions = serverSubscriptions.update;
	const rooms = serverRooms.update;

	// Find missing rooms/subscriptions on local database
	const findData = await findSubscriptionsRooms(subscriptions, rooms);
	// Merge each subscription into a room
	const mergedSubscriptions = findData.subscriptions.map(subscription => {
		const index = rooms.findIndex(({ _id }) => _id === subscription.rid);
		// Room not found
		if (index < 0) {
			return merge(subscription);
		}
		const [room] = rooms.splice(index, 1);
		return merge(subscription, room);
	});
	// Decrypt all subscriptions missing decryption
	const decryptedSubscriptions = (await Encryption.decryptSubscriptions(mergedSubscriptions)) as ISubscription[];

	return decryptedSubscriptions;
};

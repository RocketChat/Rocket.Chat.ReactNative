import EJSON from 'ejson';

import { Encryption } from '../../encryption';
import { store as reduxStore } from '../../auxStore';
import { compareServerVersion } from '../../utils';
import findSubscriptionsRooms from './findSubscriptionsRooms';
import normalizeMessage from './normalizeMessage';
import { ISubscription, IServerRoom, IServerSubscription, IServerSubscriptionItem, IServerRoomItem } from '../../../definitions';
// TODO: delete and update

export const merge = (
	subscription: ISubscription | IServerSubscriptionItem,
	room?: ISubscription | IServerRoomItem
): ISubscription => {
	const serverVersion = reduxStore.getState().server.version as string;
	subscription = EJSON.fromJSONValue(subscription) as ISubscription;

	if (room) {
		room = EJSON.fromJSONValue(room) as ISubscription;
		if (room._updatedAt) {
			subscription.lastMessage = normalizeMessage(room.lastMessage);
			subscription.description = room.description;
			subscription.topic = room.topic;
			subscription.announcement = room.announcement;
			subscription.reactWhenReadOnly = room.reactWhenReadOnly;
			subscription.archived = room.archived || false;
			subscription.joinCodeRequired = room.joinCodeRequired;
			subscription.jitsiTimeout = room.jitsiTimeout;
			subscription.usernames = room.usernames;
			subscription.uids = room.uids;
		}

		if (compareServerVersion(serverVersion, 'lowerThan', '3.7.0')) {
			const updatedAt = room?._updatedAt ? new Date(room._updatedAt) : null;
			const lastMessageTs = subscription?.lastMessage?.ts ? new Date(subscription.lastMessage.ts) : null;
			// @ts-ignore
			// If all parameters are null it will return zero, if only one is null it will return its timestamp only.
			// "It works", but it's not the best solution. It does not accept "Date" as a parameter, but it works.
			subscription.roomUpdatedAt = Math.max(updatedAt, lastMessageTs);
		} else {
			// https://github.com/RocketChat/Rocket.Chat/blob/develop/app/ui-sidenav/client/roomList.js#L180
			const lastRoomUpdate = room.lm || subscription.ts || subscription._updatedAt;
			// @ts-ignore Same as above scenario
			subscription.roomUpdatedAt = subscription.lr
				? // @ts-ignore Same as above scenario
				  Math.max(new Date(subscription.lr), new Date(lastRoomUpdate))
				: lastRoomUpdate;
		}
		subscription.ro = room.ro;
		subscription.broadcast = room.broadcast;
		subscription.encrypted = room.encrypted;
		subscription.e2eKeyId = room.e2eKeyId;
		subscription.avatarETag = room.avatarETag;
		subscription.teamId = room.teamId;
		subscription.teamMain = room.teamMain;
		if (!subscription.roles || !subscription.roles.length) {
			subscription.roles = [];
		}
		if (!subscription.ignored?.length) {
			subscription.ignored = [];
		}
		if (room.muted && room.muted.length) {
			subscription.muted = room.muted.filter(muted => !!muted);
		} else {
			subscription.muted = [];
		}
		if (room.v) {
			subscription.visitor = room.v;
		}
		if (room.departmentId) {
			subscription.departmentId = room.departmentId;
		}
		if (room.servedBy) {
			subscription.servedBy = room.servedBy;
		}
		if (room.livechatData) {
			subscription.livechatData = room.livechatData;
		}
		if (room.tags) {
			subscription.tags = room.tags;
		}
		subscription.sysMes = room.sysMes;
	}

	if (!subscription.name) {
		subscription.name = subscription.fname as string;
	}

	if (!subscription.autoTranslate) {
		subscription.autoTranslate = false;
	}

	subscription.blocker = !!subscription.blocker;
	subscription.blocked = !!subscription.blocked;
	return subscription;
};

export default async (serverSubscriptions: IServerSubscription, serverRooms: IServerRoom): Promise<ISubscription[]> => {
	const subscriptions = serverSubscriptions.update;
	const rooms = serverRooms.update;

	// Find missing rooms/subscriptions on local database
	const findData = await findSubscriptionsRooms(subscriptions, rooms);
	// Merge each subscription into a room
	const mergedSubscriptions = findData.subscriptions.map(subscription => {
		const index = findData.rooms.findIndex(({ _id }) => _id === subscription.rid);
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

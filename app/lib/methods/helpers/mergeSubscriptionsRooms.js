import EJSON from 'ejson';

import normalizeMessage from './normalizeMessage';
import findSubscriptionsRooms from './findSubscriptionsRooms';
import { Encryption } from '../../encryption';
// TODO: delete and update

export const merge = (subscription, room) => {
	subscription = EJSON.fromJSONValue(subscription);
	room = EJSON.fromJSONValue(room);

	if (!subscription) {
		return;
	}
	if (room) {
		if (room._updatedAt) {
			subscription.lastMessage = normalizeMessage(room.lastMessage);
			if (subscription.lastMessage) {
				subscription.roomUpdatedAt = subscription.lastMessage.ts;
			} else {
				subscription.roomUpdatedAt = room._updatedAt;
			}
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
		subscription.ro = room.ro;
		subscription.broadcast = room.broadcast;
		subscription.encrypted = room.encrypted;
		subscription.e2eKeyId = room.e2eKeyId;
		subscription.avatarETag = room.avatarETag;
		if (!subscription.roles || !subscription.roles.length) {
			subscription.roles = [];
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
		subscription.name = subscription.fname;
	}

	if (!subscription.autoTranslate) {
		subscription.autoTranslate = false;
	}

	subscription.blocker = !!subscription.blocker;
	subscription.blocked = !!subscription.blocked;
	return subscription;
};

export default async(subscriptions = [], rooms = []) => {
	if (subscriptions.update) {
		subscriptions = subscriptions.update;
		rooms = rooms.update;
	}

	// Find missing rooms/subscriptions on local database
	({ subscriptions, rooms } = await findSubscriptionsRooms(subscriptions, rooms));
	// Merge each subscription into a room
	subscriptions = subscriptions.map((s) => {
		const index = rooms.findIndex(({ _id }) => _id === s.rid);
		// Room not found
		if (index < 0) {
			return merge(s);
		}
		const [room] = rooms.splice(index, 1);
		return merge(s, room);
	});
	// Decrypt all subscriptions missing decryption
	subscriptions = await Encryption.decryptSubscriptions(subscriptions);

	return {
		subscriptions,
		rooms
	};
};

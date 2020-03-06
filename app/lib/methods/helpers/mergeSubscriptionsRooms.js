import EJSON from 'ejson';

import normalizeMessage from './normalizeMessage';
// TODO: delete and update

export const merge = (subscription, room) => {
	subscription = EJSON.fromJSONValue(subscription);
	room = EJSON.fromJSONValue(room);

	if (!subscription) {
		return;
	}
	if (room) {
		if (room._updatedAt) {
			subscription.roomUpdatedAt = room._updatedAt;
			subscription.lastMessage = normalizeMessage(room.lastMessage);
			subscription.description = room.description;
			subscription.topic = room.topic;
			subscription.announcement = room.announcement;
			subscription.reactWhenReadOnly = room.reactWhenReadOnly;
			subscription.archived = room.archived || false;
			subscription.joinCodeRequired = room.joinCodeRequired;
			subscription.jitsiTimeout = room.jitsiTimeout;
		}
		subscription.ro = room.ro;
		subscription.broadcast = room.broadcast;
		if (!subscription.roles || !subscription.roles.length) {
			subscription.roles = [];
		}
		if (room.muted && room.muted.length) {
			subscription.muted = room.muted.filter(muted => !!muted);
		} else {
			subscription.muted = [];
		}
		subscription.sysMes = room.sysMes;
	}

	if (!subscription.name) {
		subscription.name = subscription.fname;
	}

	subscription.blocker = !!subscription.blocker;
	subscription.blocked = !!subscription.blocked;
	return subscription;
};

export default (subscriptions = [], rooms = []) => {
	if (subscriptions.update) {
		subscriptions = subscriptions.update;
		rooms = rooms.update;
	}
	return {
		subscriptions: subscriptions.map((s) => {
			const index = rooms.findIndex(({ _id }) => _id === s.rid);
			if (index < 0) {
				return merge(s);
			}
			const [room] = rooms.splice(index, 1);
			return merge(s, room);
		}),
		rooms
	};
};

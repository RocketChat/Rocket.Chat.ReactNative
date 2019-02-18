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
		if (room.rid) {
			subscription.rid = room.rid;
		}
		subscription.room_updated_at = room._updatedAt;
		subscription.last_message = normalizeMessage(room.lastMessage);
		subscription.ro = room.ro;
		subscription.description = room.description;
		subscription.topic = room.topic;
		subscription.announcement = room.announcement;
		subscription.react_when_read_only = room.reactWhenReadOnly;
		subscription.archived = room.archived;
		subscription.join_code_required = room.joinCodeRequired;
		subscription.broadcast = room.broadcast;

		if (room.muted && room.muted.length) {
			subscription.muted = room.muted.filter(user => user).map(user => ({ value: user }));
		} else {
			subscription.muted = [];
		}
	}
	if (subscription.roles && subscription.roles.length) {
		subscription.roles = subscription.roles.map(role => (role.value ? role : { value: role }));
	} else {
		subscription.roles = [];
	}

	if (subscription.mobilePushNotifications === 'nothing') {
		subscription.notifications = true;
	} else {
		subscription.notifications = false;
	}

	if (!subscription.name) {
		subscription.name = subscription.fname;
	}

	subscription.id = subscription._id;
	subscription.user_mentions = subscription.userMentions;
	subscription.last_open = subscription.lastOpen;
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

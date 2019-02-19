import EJSON from 'ejson';

import normalizeMessage from './normalizeMessage';
// TODO: delete and update

export const normalizeRoom = room => ({
	rid: room._id,
	room_updated_at: room._updatedAt,
	last_message: normalizeMessage(room.lastMessage),
	ro: room.ro,
	description: room.description,
	topic: room.topic,
	announcement: room.announcement,
	react_when_read_only: room.reactWhenReadOnly,
	archived: room.archived,
	join_code_required: room.joinCodeRequired,
	broadcast: room.broadcast
});

export const normalizeSubscription = (subscription) => {
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
	subscription.blocker = !!subscription.blocker;
	subscription.blocked = !!subscription.blocked;
	return subscription;
};

export const merge = (subscription, room) => {
	if (!subscription) {
		return;
	}
	if (room) {
		subscription = {
			...subscription,
			...normalizeRoom(room)
		};

		// if (room.muted && room.muted.length) {
		// 	subscription.muted = room.muted.filter(user => user).map(user => ({ value: user }));
		// } else {
		// 	subscription.muted = [];
		// }
	}
	subscription = normalizeSubscription(subscription);
	console.log('TCL: merge -> subscription', subscription);
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
				return merge(EJSON.fromJSONValue(s));
			}
			const [room] = rooms.splice(index, 1);
			return merge(EJSON.fromJSONValue(s), EJSON.fromJSONValue(room));
		}),
		rooms
	};
};

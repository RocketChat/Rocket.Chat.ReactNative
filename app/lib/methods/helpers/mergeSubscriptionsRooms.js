import normalizeMessage from './normalizeMessage';
// TODO: delete and update

export const merge = (subscription, room) => {
	subscription.muted = [];
	if (room) {
		subscription.roomUpdatedAt = room._updatedAt;
		subscription.lastMessage = normalizeMessage(room.lastMessage);
		subscription.ro = room.ro;
		subscription.description = room.description;
		subscription.topic = room.topic;
		subscription.announcement = room.announcement;
		subscription.reactWhenReadOnly = room.reactWhenReadOnly;
		subscription.archived = room.archived;
		subscription.joinCodeRequired = room.joinCodeRequired;

		if (room.muted && room.muted.length) {
			subscription.muted = room.muted.filter(user => user).map(user => ({ value: user }));
		}
	}
	if (subscription.roles && subscription.roles.length) {
		subscription.roles = subscription.roles.map(role => (role.value ? role : { value: role }));
	}

	if (subscription.mobilePushNotifications === 'nothing') {
		subscription.notifications = true;
	} else {
		subscription.notifications = false;
	}

	subscription.blocked = !!subscription.blocker;
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

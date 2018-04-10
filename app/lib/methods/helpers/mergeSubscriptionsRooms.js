import normalizeMessage from './normalizeMessage';
// TODO: delete and update

const parse = (subscription, room) => {
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
			subscription.muted = room.muted.map(role => ({ value: role }));
		}
	}
	if (subscription.roles && subscription.roles.length) {
		subscription.roles = subscription.roles.map(role => (role.value ? role : { value: role }));
	}
	if (subscription.blocker) {
		subscription.blocked = true;
	} else {
		subscription.blocked = false;
	}
	if (subscription.mobilePushNotifications === 'nothing') {
		subscription.notifications = true;
	} else {
		subscription.notifications = false;
	}
	subscription.roles = [];
	return subscription;
};
export default (subscriptions = [], rooms = []) => {
	if (subscriptions.update) {
		subscriptions = subscriptions.update;
		rooms = rooms.update;
	}
	return subscriptions.map((s) => {
		const index = rooms.findIndex(({ _id }) => _id === s.rid);
		if (index < 0) {
			return parse(s);
		}
		const [room] = rooms.splice(index, 1);
		return parse(s, room);
	});
};

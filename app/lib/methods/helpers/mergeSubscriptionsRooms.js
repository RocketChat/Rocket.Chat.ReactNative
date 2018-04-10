import normalizeMessage from './normalizeMessage';
// TODO: delete and update
export default (subscriptions = [], rooms = []) => {
	if (subscriptions.update) {
		subscriptions = subscriptions.update;
		rooms = rooms.update;
	}
	const data = subscriptions
		.map((subscription) => {
			const room = rooms.find(({ _id }) => _id === subscription.rid);
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
				subscription.roles = subscription.roles.map(role => ({ value: role }));
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
			return subscription;
		});
	return data;
};

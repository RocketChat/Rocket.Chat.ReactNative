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
	}
	if (subscription.roles && subscription.roles.length) {
		subscription.roles = subscription.roles.map(role => ({ value: role }));
	}
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
			return s;
		}
		const [room] = rooms.splice(index, 1);
		return parse(s, room);
	});
};

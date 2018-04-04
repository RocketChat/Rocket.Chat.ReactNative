import { STATUS } from '../ddp';
import { get } from './rest';
import _ from 'lodash';
import database from '../realm';
import reduxStore from '../createStore';

const normalizeMessage = (lastMessage) => {
	if (lastMessage) {
		lastMessage.attachments = lastMessage.attachments && lastMessage.attachments.length ? lastMessage.attachments : [];
		lastMessage.reactions = _.map(lastMessage.reactions, (value, key) =>
			({ emoji: key, usernames: value.usernames.map(username => ({ value: username })) }));
	}
	return lastMessage;
};
const lastMessage = function() {
	try {
		const lastMessage = database
			.objects('subscriptions')
			.sorted('roomUpdatedAt', true)[0];
		return lastMessage && new Date(lastMessage.roomUpdatedAt);
	} catch (e) {
		return null;
	}
};

const parseData = (subscriptions = [], rooms = [], lastMessage) => {
	if (lastMessage) {
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
			}

			if (subscription.roles && subscription.roles.length) {
				subscription.roles = subscription.roles.map(role => ({ value: role }));
			}
			return subscription;
		});
	return data;
};

const getRoomDpp = async function() {
	const { ddp } = this;
	// alert(ddp.call);
	try {
		const ls = lastMessage();
		const [subscriptions, rooms] = await Promise.all([ddp.call('subscriptions/get', ls), ddp.call('rooms/get', ls)]);
		const data = parseData(subscriptions, rooms, ls);

		database.write(() => {
			data.forEach(subscription => database.create('subscriptions', subscription, true));
		});

		const { login } = reduxStore.getState();
		this.ddp.subscribe('stream-notify-user', `${ login.user.id }/subscriptions-changed`, false);
		this.ddp.subscribe('stream-notify-user', `${ login.user.id }/rooms-changed`, false);
		return data;
	} catch (e) {
		alert(`getRoom ${ e }`);
	}
};
const getRoomRest = async function() {
	const [subscriptions, rooms] = await Promise.all([get('subscriptions.get', lastMessage), get('rooms.get', lastMessage)]);
	const data = parseData(subscriptions, rooms, lastMessage());

	database.write(() => {
		data.forEach(subscription => database.create('subscriptions', subscription, true));
	});

	this.once('logged', () => {
		const { login } = reduxStore.getState();
		this.ddp.subscribe('stream-notify-user', `${ login.user.id }/subscriptions-changed`, false);
		this.ddp.subscribe('stream-notify-user', `${ login.user.id }/rooms-changed`, false);
	});
	return data;
};

export default function() {
	return getRoomDpp.apply(this);
	// return getRoomRest.apply(this);
}

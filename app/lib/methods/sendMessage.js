import Random from 'react-native-meteor/lib/Random';
import messagesStatus from '../../constants/messagesStatus';

import buildMessage from '../methods/helpers/buildMessage';
import { post } from './helpers/rest';
import database from '../realm';
import reduxStore from '../createStore';

export const getMessage = (rid, msg = {}) => {
	const _id = Random.id();
	const message = {
		_id,
		rid,
		msg,
		ts: new Date(),
		_updatedAt: new Date(),
		status: messagesStatus.TEMP,
		u: {
			_id: reduxStore.getState().login.user.id || '1',
			username: reduxStore.getState().login.user.username
		}
	};
	database.write(() => {
		database.create('messages', message, true);
	});
	return message;
};

function sendMessageByRest(message) {
	const { token, id } = this.ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	const { _id, rid, msg } = message;
	return post({ token, id, server }, 'chat.sendMessage', { message: { _id, rid, msg } });
}

function sendMessageByDDP(message) {
	const { _id, rid, msg } = message;
	return this.ddp.call('sendMessage', { _id, rid, msg });
}

export async function _sendMessageCall(message) {
	try {
		// eslint-disable-next-line
		const data = await (false && this.ddp.status ? sendMessageByDDP.call(this, message) : sendMessageByRest.call(this, message));
		return data;
	} catch (e) {
		database.write(() => {
			message.status = messagesStatus.ERROR;
			database.create('messages', message, true);
		});
	}
}

export default async function(rid, msg) {
	const { database: db } = database;
	try {
		const message = getMessage(rid, msg);
		const room = db.objects('subscriptions').filtered('rid == $0', rid);

		db.write(() => {
			room.lastMessage = message;
		});

		const ret = await _sendMessageCall.call(this, message);
		// TODO: maybe I have created a bug in the future here <3
		db.write(() => {
			db.create('messages', buildMessage({ ...message, ...ret }), true);
		});
	} catch (e) {
		console.warn('sendMessage', e);
	}
}

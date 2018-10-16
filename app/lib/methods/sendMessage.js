import Random from 'react-native-meteor/lib/Random';
import * as SDK from '@rocket.chat/sdk';

import messagesStatus from '../../constants/messagesStatus';
import buildMessage from './helpers/buildMessage';
import database from '../realm';
import reduxStore from '../createStore';
import log from '../../utils/log';

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
	try {
		database.write(() => {
			database.create('messages', message, true);
		});
	} catch (error) {
		console.warn('getMessage', error);
	}
	return message;
};

function sendMessageByRest(message) {
	const { _id, rid, msg } = message;
	return SDK.api.post('chat.sendMessage', { message: { _id, rid, msg } });
}

function sendMessageByDDP(message) {
	const { _id, rid, msg } = message;
	return SDK.driver.asyncCall('sendMessage', { _id, rid, msg });
}

export async function _sendMessageCall(message) {
	try {
		const data = await (SDK.driver.ddp ? sendMessageByDDP.call(this, message) : sendMessageByRest.call(this, message));
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
		log('sendMessage', e);
	}
}

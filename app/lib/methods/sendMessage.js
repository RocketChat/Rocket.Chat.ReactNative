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

function sendMessageByRest(args) {
	return SDK.api.post('chat.sendMessage', { message: args });
}

function sendMessageByDDP(...args) {
	try {
		return SDK.driver.asyncCall('sendMessage', ...args);
	} catch (error) {
		return sendMessageByRest.call(this, ...args);
	}
}

export async function _sendMessageCall(message) {
	const { _id, rid, msg } = message;
	const data = await (this.connected() ? sendMessageByDDP.call(this, { _id, rid, msg }) : sendMessageByRest.call(this, { _id, rid, msg }));
	return data;
}

export default async function(rid, msg) {
	const { database: db } = database;
	try {
		const message = getMessage(rid, msg);
		const room = db.objects('subscriptions').filtered('rid == $0', rid);

		db.write(() => {
			room.lastMessage = message;
		});

		try {
			const ret = await _sendMessageCall.call(this, message);
			db.write(() => {
				db.create('messages', buildMessage({ ...message, ...ret }), true);
			});
		} catch (e) {
			database.write(() => {
				message.status = messagesStatus.ERROR;
				database.create('messages', message, true);
			});
		}
	} catch (e) {
		log('sendMessage', e);
	}
}

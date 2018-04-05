import Random from 'react-native-meteor/lib/Random';
import messagesStatus from '../../constants/messagesStatus';

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

export const _sendMessageCall = async function(message) {
	try {
		const { _id, rid, msg } = message;
		const data = await (this.ddp._logged ? sendMessageByDDP.call(this, message) : sendMessageByRest.call(this, message));
		return data;
	} catch (e) {
		database.write(() => {
			message.status = messagesStatus.ERROR;
			database.create('messages', message, true);
		});
	}
};

const sendMessageByRest = function(message) {
	const { token, id } = this.ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	const { _id, rid, msg } = message;
	return post({ token, id, server }, 'chat.sendMessage', { message: { _id, rid, msg } });
};

const sendMessageByDDP = function(message) {
	const { _id, rid, msg } = message;
	return this.ddp.call('sendMessage', { _id, rid, msg });
};

export default async function(rid, msg) {
	try {
		const message = getMessage(rid, msg);
		const ret = await _sendMessageCall.call(this, message);
		// TODO: maybe I have created a bug in the future here <3
		database.write(() => {
			ret.status = messagesStatus.sent;
			database.create('messages', { ...message, ...ret }, true);
		});
	} catch (e) {
		console.log(e);
	}
}

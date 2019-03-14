import messagesStatus from '../../constants/messagesStatus';
import buildMessage from './helpers/buildMessage';
import database from '../realm';
import reduxStore from '../createStore';
import log from '../../utils/log';
import random from '../../utils/random';

export const getMessage = (rid, msg = {}) => {
	const _id = random(17);
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

export async function sendMessageCall(message) {
	const { _id, rid, msg } = message;
	// RC 0.60.0
	const data = await this.sdk.post('chat.sendMessage', { message: { _id, rid, msg } });
	return data;
}

export default async function(rid, msg) {
	try {
		const message = getMessage(rid, msg);
		const room = database.objects('subscriptions').filtered('rid == $0', rid);

		// TODO: do we need this?
		database.write(() => {
			room.lastMessage = message;
		});

		try {
			const ret = await sendMessageCall.call(this, message);
			database.write(() => {
				database.create('messages', buildMessage({ ...message, ...ret }), true);
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

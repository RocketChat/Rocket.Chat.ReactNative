import messagesStatus from '../../constants/messagesStatus';
import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';
import random from '../../utils/random';

export const getMessage = (rid, msg = '', tmid, user) => {
	const _id = random(17);
	const { id, username } = user;
	const message = {
		_id,
		rid,
		msg,
		tmid,
		ts: new Date(),
		_updatedAt: new Date(),
		status: messagesStatus.TEMP,
		u: {
			_id: id || '1',
			username
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
	const {
		_id, rid, msg, tmid
	} = message;
	// RC 0.60.0
	const data = await this.sdk.post('chat.sendMessage', {
		message: {
			_id, rid, msg, tmid
		}
	});
	return data;
}

export default async function(rid, msg, tmid, user) {
	try {
		const message = getMessage(rid, msg, tmid, user);
		const [room] = database.objects('subscriptions').filtered('rid == $0', rid);

		if (room) {
			database.write(() => {
				room.draftMessage = null;
			});
		}

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
		log('err_send_message', e);
	}
}

import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import messagesStatus from '../../constants/messagesStatus';
import database from '../database';
import log from '../../utils/log';
import random from '../../utils/random';

export const getMessage = async(rid, msg = '', tmid, user) => {
	const _id = random(17);
	const { id, username } = user;
	try {
		const db = database.active;
		const msgCollection = db.collections.get('messages');
		let message;
		await db.action(async() => {
			message = await msgCollection.create((m) => {
				m._raw = sanitizedRaw({ id: _id }, msgCollection.schema);
				m.subscription.id = rid;
				m.msg = msg;
				m.tmid = tmid;
				m.ts = new Date();
				m._updatedAt = new Date();
				m.status = messagesStatus.TEMP;
				m.u = {
					_id: id || '1',
					username
				};
			});
		});
		return message;
	} catch (error) {
		console.warn('getMessage', error);
	}
};

export async function sendMessageCall(message) {
	const {
		id: _id, subscription: { id: rid }, msg, tmid
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
		const db = database.active;
		const subsCollections = db.collections.get('subscriptions');
		const message = await getMessage(rid, msg, tmid, user);
		if (!message) {
			return;
		}

		try {
			const room = await subsCollections.find(rid);
			await db.action(async() => {
				await room.update((r) => {
					r.draftMessage = null;
				});
			});
		} catch (e) {
			// Do nothing
		}

		try {
			await sendMessageCall.call(this, message);
			await db.action(async() => {
				await message.update((m) => {
					m.status = messagesStatus.SENT;
				});
			});
		} catch (e) {
			await db.action(async() => {
				await message.update((m) => {
					m.status = messagesStatus.ERROR;
				});
			});
		}
	} catch (e) {
		log(e);
	}
}

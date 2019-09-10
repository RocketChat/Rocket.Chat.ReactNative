import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import messagesStatus from '../../constants/messagesStatus';
import watermelondb from '../database';
import log from '../../utils/log';
import random from '../../utils/random';
import I18n from '../../i18n';

export const getMessage = async(rid, msg = { message: '', type: null }, tmid, user) => {
	const _id = random(17);
	const { id, username } = user;
	try {
		const watermelon = watermelondb.database;
		const msgCollection = watermelon.collections.get('messages');
		let message;
		await watermelon.action(async() => {
			message = await msgCollection.create((m) => {
				m._raw = sanitizedRaw({ id: _id }, msgCollection.schema);
				m.subscription.id = rid;
				m.msg = msg.message;
				m.t = msg.type;
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
		id: _id, subscription: { id: rid }, msg, tmid, t
	} = message;
	// RC 0.60.0

	const _message = {
		_id, rid, msg, tmid
	};

	if (t) {
		_message.t = t;
	}

	if (t === 'jitsi_call_started') {
		_message.actionLinks = [{
			icon: 'icon-videocam',
			label: I18n.t('Click_to_join'),
			method_id: 'joinJitsiCall',
			params: ''
		}];
	}

	const data = await this.sdk.post('chat.sendMessage', { message: _message });
	return data;
}

export default async function(rid, msg, tmid, user) {
	try {
		const watermelon = watermelondb.database;
		const subsCollections = watermelon.collections.get('subscriptions');
		const message = await getMessage(rid, msg, tmid, user);
		if (!message) {
			return;
		}

		try {
			const room = await subsCollections.find(rid);
			await watermelon.action(async() => {
				await room.update((r) => {
					r.draftMessage = null;
				});
			});
		} catch (e) {
			// Do nothing
		}

		try {
			await sendMessageCall.call(this, message);
		} catch (e) {
			await watermelon.action(async() => {
				await message.update((m) => {
					m.status = messagesStatus.ERROR;
				});
			});
		}
	} catch (e) {
		log(e);
	}
}

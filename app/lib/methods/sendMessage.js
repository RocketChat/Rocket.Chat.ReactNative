import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import messagesStatus from '../../constants/messagesStatus';
import database from '../database';
import log from '../../utils/log';
import random from '../../utils/random';

export async function sendMessageCall(message) {
	const {
		id: _id, subscription: { id: rid }, msg, tmid
	} = message;
	try {
		// RC 0.60.0
		await this.sdk.post('chat.sendMessage', {
			message: {
				_id, rid, msg, tmid
			}
		});
	} catch (e) {
		const db = database.active;
		const msgCollection = db.collections.get('messages');
		const threadMessagesCollection = db.collections.get('thread_messages');
		const errorBatch = [];
		const messageRecord = await msgCollection.find(_id);
		errorBatch.push(
			messageRecord.prepareUpdate((m) => {
				m.status = messagesStatus.ERROR;
			})
		);

		if (tmid) {
			const threadMessageRecord = await threadMessagesCollection.find(_id);
			errorBatch.push(
				threadMessageRecord.prepareUpdate((tm) => {
					tm.status = messagesStatus.ERROR;
				})
			);
		}

		await db.action(async() => {
			await db.batch(...errorBatch);
		});
	}
}

export default async function(rid, msg, tmid, user) {
	try {
		const db = database.active;
		const subsCollection = db.collections.get('subscriptions');
		const msgCollection = db.collections.get('messages');
		const threadMessagesCollection = db.collections.get('thread_messages');
		const messageId = random(17);
		const batch = [];
		const message = {
			id: messageId, subscription: { id: rid }, msg, tmid
		};
		batch.push(
			msgCollection.prepareCreate((m) => {
				m._raw = sanitizedRaw({ id: messageId }, msgCollection.schema);
				m.subscription.id = rid;
				m.msg = msg;
				m.tmid = tmid;
				m.ts = new Date();
				m._updatedAt = new Date();
				m.status = messagesStatus.TEMP;
				m.u = {
					_id: user.id || '1',
					username: user.username
				};
			})
		);

		if (tmid) {
			batch.push(
				threadMessagesCollection.prepareCreate((tm) => {
					tm._raw = sanitizedRaw({ id: messageId }, threadMessagesCollection.schema);
					tm.subscription.id = rid;
					tm.rid = tmid;
					tm.msg = msg;
					tm.ts = new Date();
					tm._updatedAt = new Date();
					tm.status = messagesStatus.TEMP;
					tm.u = {
						_id: user.id || '1',
						username: user.username
					};
				})
			);
		}

		try {
			const room = await subsCollection.find(rid);
			if (room.draftMessage) {
				batch.push(
					room.prepareUpdate((r) => {
						r.draftMessage = null;
					})
				);
			}
		} catch (e) {
			// Do nothing
		}

		try {
			await db.action(async() => {
				await db.batch(...batch);
			});
		} catch (e) {
			log(e);
			return;
		}

		await sendMessageCall.call(this, message);
	} catch (e) {
		log(e);
	}
}

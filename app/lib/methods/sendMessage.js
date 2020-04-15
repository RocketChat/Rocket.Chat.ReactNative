import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import messagesStatus from '../../constants/messagesStatus';
import database from '../database';
import log from '../../utils/log';
import random from '../../utils/random';

const changeMessageStatus = async(id, tmid, status, message) => {
	const db = database.active;
	const msgCollection = db.collections.get('messages');
	const threadMessagesCollection = db.collections.get('thread_messages');
	const successBatch = [];
	const messageRecord = await msgCollection.find(id);
	successBatch.push(
		messageRecord.prepareUpdate((m) => {
			m.status = status;
			if (message) {
				m.mentions = message.mentions;
				m.channels = message.channels;
			}
		})
	);

	if (tmid) {
		const threadMessageRecord = await threadMessagesCollection.find(id);
		successBatch.push(
			threadMessageRecord.prepareUpdate((tm) => {
				tm.status = status;
				if (message) {
					tm.mentions = message.mentions;
					tm.channels = message.channels;
				}
			})
		);
	}

	try {
		await db.action(async() => {
			await db.batch(...successBatch);
		});
	} catch (error) {
		// Do nothing
	}
};

export async function sendMessageCall(message) {
	const {
		id: _id, subscription: { id: rid }, msg, tmid
	} = message;
	try {
		const sdk = this.shareSDK || this.sdk;
		// RC 0.60.0
		const result = await sdk.post('chat.sendMessage', {
			message: {
				_id, rid, msg, tmid
			}
		});
		if (result.success) {
			return changeMessageStatus(_id, tmid, messagesStatus.SENT, result.message);
		}
	} catch {
		// do nothing
	}
	return changeMessageStatus(_id, tmid, messagesStatus.ERROR);
}

export default async function(rid, msg, tmid, user) {
	try {
		const db = database.active;
		const subsCollection = db.collections.get('subscriptions');
		const msgCollection = db.collections.get('messages');
		const threadCollection = db.collections.get('threads');
		const threadMessagesCollection = db.collections.get('thread_messages');
		const messageId = random(17);
		const batch = [];
		const message = {
			id: messageId, subscription: { id: rid }, msg, tmid
		};
		const messageDate = new Date();
		let tMessageRecord;

		// If it's replying to a thread
		if (tmid) {
			try {
				// Find thread message header in Messages collection
				tMessageRecord = await msgCollection.find(tmid);
				batch.push(
					tMessageRecord.prepareUpdate((m) => {
						m.tlm = messageDate;
						m.tcount += 1;
					})
				);

				try {
					// Find thread message header in Threads collection
					await threadCollection.find(tmid);
				} catch (error) {
					// If there's no record, create one
					batch.push(
						threadCollection.prepareCreate((tm) => {
							tm._raw = sanitizedRaw({ id: tmid }, threadCollection.schema);
							tm.subscription.id = rid;
							tm.tmid = tmid;
							tm.msg = tMessageRecord.msg;
							tm.ts = tMessageRecord.ts;
							tm._updatedAt = messageDate;
							tm.status = messagesStatus.SENT; // Original message was sent already
							tm.u = tMessageRecord.u;
						})
					);
				}

				// Create the message sent in ThreadMessages collection
				batch.push(
					threadMessagesCollection.prepareCreate((tm) => {
						tm._raw = sanitizedRaw({ id: messageId }, threadMessagesCollection.schema);
						tm.subscription.id = rid;
						tm.rid = tmid;
						tm.msg = msg;
						tm.ts = messageDate;
						tm._updatedAt = messageDate;
						tm.status = messagesStatus.TEMP;
						tm.u = {
							_id: user.id || '1',
							username: user.username
						};
					})
				);
			} catch (e) {
				log(e);
			}
		}

		// Create the message sent in Messages collection
		batch.push(
			msgCollection.prepareCreate((m) => {
				m._raw = sanitizedRaw({ id: messageId }, msgCollection.schema);
				m.subscription.id = rid;
				m.msg = msg;
				m.ts = messageDate;
				m._updatedAt = messageDate;
				m.status = messagesStatus.TEMP;
				m.u = {
					_id: user.id || '1',
					username: user.username
				};
				if (tmid && tMessageRecord) {
					m.tmid = tmid;
					m.tlm = messageDate;
					m.tmsg = tMessageRecord.msg;
				}
			})
		);

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

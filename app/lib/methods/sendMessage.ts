import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import messagesStatus from '../../constants/messagesStatus';
import database from '../database';
import log from '../../utils/log';
import random from '../../utils/random';
import { Encryption } from '../encryption';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../encryption/constants';
import {
	IMessage,
	IRocketChat,
	IUser,
	TMessageModel,
	TSubscriptionModel,
	TThreadMessageModel,
	TThreadModel
} from '../../definitions';
import sdk from '../rocketchat/services/sdk';

type TMessages = TMessageModel | TThreadMessageModel;

const changeMessageStatus = async (id: string, tmid: string, status: number, message?: IMessage) => {
	const db = database.active;
	const msgCollection = db.get('messages');
	const threadMessagesCollection = db.get('thread_messages');
	const successBatch = [] as TMessages[];
	const messageRecord = await msgCollection.find(id);
	successBatch.push(
		messageRecord.prepareUpdate(m => {
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
			threadMessageRecord.prepareUpdate(tm => {
				tm.status = status;
				if (message) {
					tm.mentions = message.mentions;
					tm.channels = message.channels;
				}
			})
		);
	}

	try {
		await db.write(async () => {
			await db.batch(...successBatch);
		});
	} catch (error) {
		// Do nothing
	}
};

export async function sendMessageCall(message: TMessageModel) {
	const { _id, tmid } = message;
	try {
		// RC 0.60.0
		const result = await sdk.post('chat.sendMessage', { message });
		if (result.success) {
			return changeMessageStatus(_id, tmid as string, messagesStatus.SENT, result.message);
		}
	} catch {
		// do nothing
	}
	return changeMessageStatus(_id, tmid as string, messagesStatus.ERROR);
}

export async function resendMessage(this: IRocketChat, message: TMessageModel, tmid: string) {
	const db = database.active;
	try {
		await db.write(async () => {
			await message.update(m => {
				m.status = messagesStatus.TEMP;
			});
		});
		let m = {
			_id: message.id,
			rid: message.subscription.id,
			msg: message.msg
		} as TMessageModel;
		if (tmid) {
			m = {
				...m,
				tmid
			} as TMessageModel;
		}
		m = await Encryption.encryptMessage(m);

		await sendMessageCall.call(this, m);
	} catch (e) {
		log(e);
	}
}

export default async function (this: IRocketChat, rid: string, msg: string, tmid: string, user: IUser, tshow?: boolean) {
	try {
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		const msgCollection = db.get('messages');
		const threadCollection = db.get('threads');
		const threadMessagesCollection = db.get('thread_messages');
		const messageId = random(17);
		const batch: (TMessageModel | TThreadMessageModel | TThreadModel | TSubscriptionModel)[] = [];

		let message = {
			_id: messageId,
			rid,
			msg,
			tmid,
			tshow
		} as TMessageModel;
		message = await Encryption.encryptMessage(message);

		const messageDate = new Date();
		let tMessageRecord: TMessageModel;

		// If it's replying to a thread
		if (tmid) {
			try {
				// Find thread message header in Messages collection
				tMessageRecord = await msgCollection.find(tmid);
				batch.push(
					tMessageRecord.prepareUpdate(m => {
						m.tlm = messageDate;
						if (m.tcount) {
							m.tcount += 1;
						}
					})
				);

				try {
					// Find thread message header in Threads collection
					await threadCollection.find(tmid);
				} catch (error) {
					// If there's no record, create one
					batch.push(
						threadCollection.prepareCreate(tm => {
							tm._raw = sanitizedRaw({ id: tmid }, threadCollection.schema);
							if (tm.subscription) {
								tm.subscription.id = rid;
							}
							tm.tmid = tmid;
							tm.msg = tMessageRecord.msg;
							tm.ts = tMessageRecord.ts;
							tm._updatedAt = messageDate;
							tm.status = messagesStatus.SENT; // Original message was sent already
							tm.u = tMessageRecord.u;
							tm.t = message.t;
							if (message.t === E2E_MESSAGE_TYPE) {
								tm.e2e = E2E_STATUS.DONE;
							}
						})
					);
				}

				// Create the message sent in ThreadMessages collection
				batch.push(
					threadMessagesCollection.prepareCreate(tm => {
						tm._raw = sanitizedRaw({ id: messageId }, threadMessagesCollection.schema);
						if (tm.subscription) {
							tm.subscription.id = rid;
						}
						tm.rid = tmid;
						tm.msg = msg;
						tm.ts = messageDate;
						tm._updatedAt = messageDate;
						tm.status = messagesStatus.TEMP;
						tm.u = {
							_id: user.id || '1',
							username: user.username,
							name: user.name
						};
						tm.t = message.t;
						if (message.t === E2E_MESSAGE_TYPE) {
							tm.e2e = E2E_STATUS.DONE;
						}
					})
				);
			} catch (e) {
				log(e);
			}
		}

		// Create the message sent in Messages collection
		batch.push(
			msgCollection.prepareCreate(m => {
				m._raw = sanitizedRaw({ id: messageId }, msgCollection.schema);
				m.subscription.id = rid;
				m.msg = msg;
				m.ts = messageDate;
				m._updatedAt = messageDate;
				m.status = messagesStatus.TEMP;
				m.u = {
					_id: user.id || '1',
					username: user.username,
					name: user.name
				};
				if (tmid && tMessageRecord) {
					m.tmid = tmid;
					// m.tlm = messageDate; // I don't think this is necessary... leaving it commented just in case...
					m.tmsg = tMessageRecord.msg;
					m.tshow = tshow;
				}
				m.t = message.t;
				if (message.t === E2E_MESSAGE_TYPE) {
					m.e2e = E2E_STATUS.DONE;
				}
			})
		);

		try {
			const room = await subsCollection.find(rid);
			if (room.draftMessage) {
				batch.push(
					room.prepareUpdate(r => {
						r.draftMessage = null;
					})
				);
			}
		} catch (e) {
			// Do nothing
		}

		try {
			await db.write(async () => {
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

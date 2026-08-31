import { type Model, Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import EJSON from 'ejson';

import database from '../database';
import log from './helpers/log';
import { Encryption } from '../encryption';
import protectedFunction from './helpers/protectedFunction';
import buildMessage from './helpers/buildMessage';
import { type TThreadMessageModel, type TThreadModel } from '../../definitions';
import { getThreadById } from '../database/services/Thread';
import sdk from '../services/sdk';

async function load({ tmid }: { tmid: string }) {
	try {
		// RC 1.0
		const result = await sdk.methodCallWrapper('getThreadMessages', { tmid });
		if (!result) {
			return [];
		}
		return EJSON.fromJSONValue(result);
	} catch {
		return [];
	}
}

// The only refresh the threads record gets on open, so updates missed by the room stream reach the UI.
async function prepareThreadUpsert(threadParent: TThreadModel | undefined, rid: string): Promise<Model | null> {
	if (!threadParent) {
		return null;
	}
	const threadsCollection = database.active.get('threads');
	const threadRecord = await getThreadById(threadParent._id);
	if (!threadRecord) {
		return threadsCollection.prepareCreate(
			protectedFunction((t: TThreadModel) => {
				t._raw = sanitizedRaw({ id: threadParent._id }, threadsCollection.schema);
				Object.assign(t, threadParent);
				if (t.subscription) {
					t.subscription.id = rid;
				}
			})
		);
	}
	if (threadRecord._updatedAt < threadParent._updatedAt) {
		return threadRecord.prepareUpdate(
			protectedFunction((t: TThreadModel) => {
				Object.assign(t, threadParent);
			})
		);
	}
	return null;
}

export function loadThreadMessages({ tmid, rid }: { tmid: string; rid: string }) {
	return new Promise<void>(async (resolve, reject) => {
		try {
			let data = await load({ tmid });
			if (data && data.length) {
				try {
					data = data.map((m: TThreadMessageModel) => buildMessage(m));
					data = await Encryption.decryptMessages(data);
					const threadParent = data.find((m: TThreadMessageModel) => m._id === tmid);
					data = data.filter((m: TThreadMessageModel) => m.tmid);
					const db = database.active;
					const threadMessagesCollection = db.get('thread_messages');
					const allThreadMessagesRecords = await threadMessagesCollection.query(Q.where('rid', tmid)).fetch();
					const filterThreadMessagesToCreate = data.filter(
						(i1: TThreadMessageModel) => !allThreadMessagesRecords.find(i2 => i1._id === i2.id)
					);
					const filterThreadMessagesToUpdate = allThreadMessagesRecords.filter(i1 =>
						data.find((i2: TThreadMessageModel) => i1.id === i2._id && i1._updatedAt < i2?._updatedAt)
					);

					const threadMessagesToCreate = filterThreadMessagesToCreate.map((threadMessage: TThreadMessageModel) =>
						threadMessagesCollection.prepareCreate(
							protectedFunction((tm: TThreadMessageModel) => {
								tm._raw = sanitizedRaw({ id: threadMessage._id }, threadMessagesCollection.schema);
								Object.assign(tm, threadMessage);
								if (tm.subscription) {
									tm.subscription.id = rid;
								}
								if (threadMessage.tmid) {
									tm.rid = threadMessage.tmid;
								}
								delete threadMessage.tmid;
							})
						)
					);

					const threadMessagesToUpdate = filterThreadMessagesToUpdate.map(threadMessage => {
						const newThreadMessage = data.find((t: TThreadMessageModel) => t._id === threadMessage.id);
						return threadMessage.prepareUpdate(
							protectedFunction((tm: TThreadMessageModel) => {
								const { attachments } = tm;
								Object.assign(tm, newThreadMessage);
								tm.attachments = attachments;
								if (threadMessage.tmid) {
									tm.rid = threadMessage.tmid;
								}
								delete threadMessage.tmid;
							})
						);
					});

					const threadToUpsert = await prepareThreadUpsert(threadParent, rid);

					await db.write(async () => {
						await db.batch([threadToUpsert, ...threadMessagesToCreate, ...threadMessagesToUpdate].filter(Boolean) as Model[]);
					});
				} catch (e) {
					log(e);
				}
				return resolve(data);
			}
			return resolve();
		} catch (e) {
			reject(e);
		}
	});
}

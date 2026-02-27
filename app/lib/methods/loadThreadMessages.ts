import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import EJSON from 'ejson';

import database from '../database';
import log from './helpers/log';
import { Encryption } from '../encryption';
import protectedFunction from './helpers/protectedFunction';
import buildMessage from './helpers/buildMessage';
import { type TThreadMessageModel } from '../../definitions';
import sdk from '../services/sdk';

async function load({ tmid }: { tmid: string }) {
	const MAX_ATTEMPTS = 3;
	/* eslint-disable no-await-in-loop */
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			// RC 1.0
			const result = await sdk.methodCallWrapper('getThreadMessages', { tmid });
			if (!result) {
				return [];
			}
			return EJSON.fromJSONValue(result);
		} catch (e) {
			if (attempt < MAX_ATTEMPTS) {
				await new Promise(resolve => setTimeout(resolve, attempt * 500));
			} else {
				throw e;
			}
		}
	}
	/* eslint-enable no-await-in-loop */
}

export function loadThreadMessages({ tmid, rid }: { tmid: string; rid: string }) {
	return new Promise<void>(async (resolve, reject) => {
		try {
			let data = await load({ tmid });
			if (data && data.length) {
				try {
					data = data.filter((m: TThreadMessageModel) => m.tmid).map((m: TThreadMessageModel) => buildMessage(m));
					data = await Encryption.decryptMessages(data);
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

					await db.write(async () => {
						await db.batch([...threadMessagesToCreate, ...threadMessagesToUpdate]);
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

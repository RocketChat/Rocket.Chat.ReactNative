import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import EJSON from 'ejson';

import buildMessage from './helpers/buildMessage';
import database from '../database';
import log from '../../utils/log';
import protectedFunction from './helpers/protectedFunction';
import { Encryption } from '../encryption';

async function load({ tmid }) {
	try {
		// RC 1.0
		const result = await this.methodCallWrapper('getThreadMessages', { tmid });
		if (!result) {
			return [];
		}
		return EJSON.fromJSONValue(result);
	} catch (error) {
		console.log(error);
		return [];
	}
}

export default function loadThreadMessages({ tmid, rid }) {
	return new Promise(async(resolve, reject) => {
		try {
			let data = await load.call(this, { tmid });
			if (data && data.length) {
				try {
					data = data.filter(m => m.tmid).map(m => buildMessage(m));
					data = await Encryption.decryptMessages(data);
					const db = database.active;
					const threadMessagesCollection = db.get('thread_messages');
					const allThreadMessagesRecords = await threadMessagesCollection.query(Q.where('rid', tmid)).fetch();
					let threadMessagesToCreate = data.filter(i1 => !allThreadMessagesRecords.find(i2 => i1._id === i2.id));
					let threadMessagesToUpdate = allThreadMessagesRecords.filter(i1 => data.find(i2 => i1.id === i2._id));

					threadMessagesToCreate = threadMessagesToCreate.map(threadMessage => threadMessagesCollection.prepareCreate(protectedFunction((tm) => {
						tm._raw = sanitizedRaw({ id: threadMessage._id }, threadMessagesCollection.schema);
						Object.assign(tm, threadMessage);
						tm.subscription.id = rid;
						tm.rid = threadMessage.tmid;
						delete threadMessage.tmid;
					})));

					threadMessagesToUpdate = threadMessagesToUpdate.map((threadMessage) => {
						const newThreadMessage = data.find(t => t._id === threadMessage.id);
						return threadMessage.prepareUpdate(protectedFunction((tm) => {
							Object.assign(tm, newThreadMessage);
							tm.rid = threadMessage.tmid;
							delete threadMessage.tmid;
						}));
					});

					await db.action(async() => {
						await db.batch(
							...threadMessagesToCreate,
							...threadMessagesToUpdate
						);
					});
				} catch (e) {
					log(e);
				}
				return resolve(data);
			} else {
				return resolve([]);
			}
		} catch (e) {
			reject(e);
		}
	});
}

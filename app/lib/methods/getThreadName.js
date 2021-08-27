import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import { getMessageById } from '../database/services/Message';
import { getThreadById } from '../database/services/Thread';
import log from '../../utils/log';
import getSingleMessage from './getSingleMessage';
import { Encryption } from '../encryption';

const buildThreadName = thread => thread.msg || thread?.attachments?.[0]?.title;

const getThreadName = async(rid, tmid, messageId) => {
	let tmsg;
	try {
		const db = database.active;
		const threadCollection = db.get('threads');
		const messageRecord = await getMessageById(messageId);
		const threadRecord = await getThreadById(tmid);
		if (threadRecord) {
			tmsg = buildThreadName(threadRecord);
			await db.action(async() => {
				await messageRecord?.update((m) => {
					m.tmsg = tmsg;
				});
			});
		} else {
			let thread = await getSingleMessage(tmid);
			thread = await Encryption.decryptMessage(thread);
			tmsg = buildThreadName(thread);
			await db.action(async() => {
				await db.batch(
					threadCollection?.prepareCreate((t) => {
						t._raw = sanitizedRaw({ id: thread._id }, threadCollection.schema);
						t.subscription.id = rid;
						Object.assign(t, thread);
					}),
					messageRecord?.prepareUpdate((m) => {
						m.tmsg = tmsg;
					})
				);
			});
		}
	} catch (e) {
		log(e);
	}
	return tmsg;
};

export default getThreadName;

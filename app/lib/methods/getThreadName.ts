import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import { getMessageById } from '../database/services/Message';
import { getThreadById } from '../database/services/Thread';
import log from './helpers/log';
import { Encryption } from '../encryption';
import getSingleMessage from './getSingleMessage';
import { IMessage, IThread, TThreadModel } from '../../definitions';

const buildThreadName = (thread: IThread | IMessage): string | undefined => thread.msg || thread?.attachments?.[0]?.title;

const getThreadName = async (rid: string, tmid: string, messageId: string): Promise<string | undefined> => {
	let tmsg: string | undefined;
	try {
		const db = database.active;
		const threadCollection = db.get('threads');
		const messageRecord = await getMessageById(messageId);
		const threadRecord = await getThreadById(tmid);
		if (threadRecord) {
			tmsg = buildThreadName(threadRecord);
			await db.write(async () => {
				await messageRecord?.update(m => {
					m.tmsg = tmsg;
				});
			});
		} else {
			let thread = await getSingleMessage(tmid);
			thread = await Encryption.decryptMessage(thread);
			tmsg = buildThreadName(thread);
			await db.write(async () => {
				await db.batch(
					threadCollection?.prepareCreate((t: TThreadModel) => {
						t._raw = sanitizedRaw({ id: thread._id }, threadCollection.schema);
						if (t.subscription) t.subscription.id = rid;
						Object.assign(t, thread);
					}),
					messageRecord?.prepareUpdate(m => {
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

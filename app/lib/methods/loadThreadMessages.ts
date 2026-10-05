import { type Model, Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import log from './helpers/log';
import { Encryption } from '../encryption';
import protectedFunction from './helpers/protectedFunction';
import buildMessage from './helpers/buildMessage';
import { type TThreadMessageModel, type TThreadModel } from '~/definitions';
import { getThreadById } from '../database/services/Thread';
import { getSingleMessage, getThreadMessagesDdp, getThreadMessagesPage, isThreadMessagesPaginated } from '../services/restApi';

interface IPaginationState {
	loaded: number;
	total: number;
}

const pagination = new Map<string, IPaginationState>();
const inFlight = new Map<string, Promise<void>>();

export const hasMoreThreadMessages = (tmid: string): boolean => {
	const state = pagination.get(tmid);
	return !!state && state.loaded < state.total;
};

async function load({ tmid }: { tmid: string }): Promise<{ messages: any; state?: IPaginationState }> {
	try {
		if (!isThreadMessagesPaginated()) {
			pagination.delete(tmid);
			return { messages: await getThreadMessagesDdp(tmid) };
		}
		const [root, page] = await Promise.all([getSingleMessage(tmid), getThreadMessagesPage({ tmid, offset: 0 })]);
		if (!root.success) {
			return { messages: [] };
		}
		return { messages: [root.message, ...page.messages], state: { loaded: page.messages.length, total: page.total } };
	} catch {
		return { messages: [] };
	}
}

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

async function saveThreadMessages({
	tmid,
	rid,
	messages
}: {
	tmid: string;
	rid: string;
	messages: any;
}): Promise<{ data: any; saved: boolean }> {
	let data = messages;
	if (!data || !data.length) {
		return { data: undefined, saved: true };
	}
	try {
		data = data
			.filter(Boolean)
			.map((m: TThreadMessageModel) => buildMessage(m))
			.filter((m: TThreadMessageModel | null): m is TThreadMessageModel => !!m);
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
		return { data, saved: false };
	}
	return { data, saved: true };
}

export async function loadThreadMessages({ tmid, rid }: { tmid: string; rid: string }): Promise<void> {
	const { messages, state } = await load({ tmid });
	const previous = pagination.get(tmid);
	if (state) {
		pagination.set(tmid, state);
	}
	const { data, saved } = await saveThreadMessages({ tmid, rid, messages });
	if (state && !saved) {
		if (previous) {
			pagination.set(tmid, previous);
		} else {
			pagination.delete(tmid);
		}
	}
	return data;
}

export function loadMoreThreadMessages({ tmid, rid }: { tmid: string; rid: string }): Promise<void> {
	const pending = inFlight.get(tmid);
	if (pending) {
		return pending;
	}
	if (!hasMoreThreadMessages(tmid)) {
		return Promise.resolve();
	}
	const request = (async () => {
		try {
			const previous = pagination.get(tmid)!;
			const page = await getThreadMessagesPage({ tmid, offset: previous.loaded });
			pagination.set(tmid, {
				loaded: previous.loaded + page.messages.length,
				total: page.messages.length ? page.total : previous.loaded
			});
			const { saved } = await saveThreadMessages({ tmid, rid, messages: page.messages });
			if (!saved) {
				pagination.set(tmid, previous);
			}
		} catch (e) {
			log(e);
		} finally {
			inFlight.delete(tmid);
		}
	})();
	inFlight.set(tmid, request);
	return request;
}

export async function loadAllThreadMessages({ tmid, rid }: { tmid: string; rid: string }): Promise<void> {
	while (hasMoreThreadMessages(tmid)) {
		const before = pagination.get(tmid)!.loaded;
		await loadMoreThreadMessages({ tmid, rid });
		if (pagination.get(tmid)!.loaded === before) {
			return;
		}
	}
}

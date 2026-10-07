import { type Model, Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import log from './helpers/log';
import { Encryption } from '../encryption';
import protectedFunction from './helpers/protectedFunction';
import buildMessage from './helpers/buildMessage';
import { type IMessage, type TThreadMessageModel, type TThreadModel } from '~/definitions';
import { getThreadById } from '../database/services/Thread';
import { getSingleMessage, getThreadMessagesDdp, getThreadMessagesPage, isThreadMessagesPaginated } from '../services/restApi';

interface IPaginationState {
	loaded: number;
	total: number;
}

const pagination = new Map<string, IPaginationState>();
const inFlight = new Map<string, Promise<unknown>>();
const loadedListeners = new Set<(tmid: string) => void>();

export const subscribeThreadLoaded = (listener: (tmid: string) => void) => {
	loadedListeners.add(listener);
	return () => {
		loadedListeners.delete(listener);
	};
};

export const hasMoreThreadMessages = (tmid: string): boolean => {
	const state = pagination.get(tmid);
	return !!state && state.loaded < state.total;
};

async function load({ tmid }: { tmid: string }): Promise<{ messages: IMessage[]; state?: IPaginationState }> {
	try {
		if (!isThreadMessagesPaginated()) {
			pagination.delete(tmid);
			return { messages: await getThreadMessagesDdp(tmid) };
		}
		const [root, page] = await Promise.all([
			getSingleMessage(tmid).catch(e => {
				log(e);
				return null;
			}),
			getThreadMessagesPage({ tmid, offset: 0 })
		]);
		const messages = root?.success ? [root.message, ...page.messages] : page.messages;
		return { messages, state: { loaded: page.messages.length, total: page.total } };
	} catch (e) {
		log(e);
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

async function saveThreadMessages({ tmid, rid, messages }: { tmid: string; rid: string; messages: IMessage[] }): Promise<void> {
	if (!messages?.length) {
		return;
	}
	const built = messages
		.filter(Boolean)
		.map(m => buildMessage(m))
		.filter((m): m is TThreadMessageModel => !!m);
	const decrypted = (await Encryption.decryptMessages(built)) as TThreadMessageModel[];
	const threadParent = decrypted.find(m => m._id === tmid);
	const data = decrypted.filter(m => m.tmid);
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
}

const track = <T>(tmid: string, run: () => Promise<T>): Promise<T> => {
	const pending = inFlight.get(tmid);
	const request: Promise<T> = (async () => {
		await pending;
		const result = await run();
		loadedListeners.forEach(listener => listener(tmid));
		return result;
	})().finally(() => {
		if (inFlight.get(tmid) === request) {
			inFlight.delete(tmid);
		}
	});
	inFlight.set(tmid, request);
	return request;
};

export async function loadThreadMessages({ tmid, rid }: { tmid: string; rid: string }): Promise<void> {
	await track(tmid, async () => {
		const { messages, state } = await load({ tmid });
		const previous = pagination.get(tmid);
		if (state) {
			pagination.set(tmid, state);
		}
		try {
			await saveThreadMessages({ tmid, rid, messages });
		} catch (e) {
			log(e);
			if (state) {
				pagination.set(tmid, previous ?? { loaded: 0, total: state.total });
			}
		}
	});
}

// Resolves to whether a page was fetched; false when there is nothing left or the fetch failed.
const loadNextPage = ({ tmid, rid }: { tmid: string; rid: string }): Promise<boolean> =>
	track(tmid, async () => {
		const previous = pagination.get(tmid);
		if (!previous || previous.loaded >= previous.total) {
			return false;
		}
		try {
			const page = await getThreadMessagesPage({ tmid, offset: previous.loaded });
			const loaded = previous.loaded + page.messages.length;
			pagination.set(tmid, { loaded, total: page.messages.length ? page.total : loaded });
			await saveThreadMessages({ tmid, rid, messages: page.messages });
			return page.messages.length > 0;
		} catch (e) {
			log(e);
			pagination.set(tmid, previous);
			return false;
		}
	});

export async function loadMoreThreadMessages(thread: { tmid: string; rid: string }): Promise<void> {
	const pending = inFlight.get(thread.tmid);
	if (pending) {
		await pending;
		return;
	}
	// No state on a paginated server means the first page never landed, so retry it.
	await (!pagination.has(thread.tmid) && isThreadMessagesPaginated() ? loadThreadMessages(thread) : loadNextPage(thread));
}

// Resolves to whether every page is loaded.
export async function loadAllThreadMessages(thread: { tmid: string; rid: string }): Promise<boolean> {
	await inFlight.get(thread.tmid);
	let fetched = true;
	while (fetched && hasMoreThreadMessages(thread.tmid)) {
		fetched = await loadNextPage(thread);
	}
	return !hasMoreThreadMessages(thread.tmid);
}

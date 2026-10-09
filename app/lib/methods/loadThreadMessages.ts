import { type Model, Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import log from './helpers/log';
import { Encryption } from '../encryption';
import protectedFunction from './helpers/protectedFunction';
import buildMessage from './helpers/buildMessage';
import { type IMessage, type TThreadMessageModel, type TThreadModel } from '~/definitions';
import { getThreadById } from '../database/services/Thread';
import { getThreadMessageById } from '../database/services/ThreadMessage';
import { tsToMs } from '../dayjs';
import { getThreadMessages } from '../services/restApi';

interface IThreadLocation {
	tmid: string;
	rid: string;
}

interface IThreadMessageTarget {
	id: string;
	ts: Date | string | number;
}

interface IPaginationState {
	loaded: number;
	total: number;
	fullyPaged: boolean;
	oldestTs: number;
	reachedOldest: boolean;
}

interface IThreadPager {
	state?: IPaginationState;
	firstPage?: Promise<boolean>;
}

const pagination = new Map<string, IThreadPager>();
const inFlight = new Map<string, Promise<boolean>>();
const loadedListeners = new Set<() => void>();

export const subscribeThreadLoaded = (listener: () => void) => {
	loadedListeners.add(listener);
	return () => {
		loadedListeners.delete(listener);
	};
};

export const clearThreadPagination = (tmid: string): void => {
	pagination.delete(tmid);
};

const pagerFor = (tmid: string): IThreadPager => {
	const pager = pagination.get(tmid) ?? {};
	pagination.set(tmid, pager);
	return pager;
};

export const areOlderThreadMessagesMissing = (tmid: string): boolean => pagination.get(tmid)?.state?.reachedOldest === false;

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
	if (tsToMs(threadRecord._updatedAt) < tsToMs(threadParent._updatedAt)) {
		return threadRecord.prepareUpdate(
			protectedFunction((t: TThreadModel) => {
				Object.assign(t, threadParent);
			})
		);
	}
	return null;
}

async function saveThreadMessages({ tmid, rid, messages }: IThreadLocation & { messages: IMessage[] }): Promise<void> {
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
	const allThreadMessagesRecords = await threadMessagesCollection.query(Q.where('id', Q.oneOf(data.map(m => m._id)))).fetch();
	const filterThreadMessagesToCreate = data.filter(
		(i1: TThreadMessageModel) => !allThreadMessagesRecords.find(i2 => i1._id === i2.id)
	);
	const filterThreadMessagesToUpdate = allThreadMessagesRecords.filter(i1 =>
		data.find((i2: TThreadMessageModel) => i1.id === i2._id && tsToMs(i1._updatedAt) < tsToMs(i2?._updatedAt))
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
	const records = [threadToUpsert, ...threadMessagesToCreate, ...threadMessagesToUpdate].filter(Boolean) as Model[];
	if (!records.length) {
		return;
	}

	await db.write(async () => {
		await db.batch(records);
	});
}

const requestPage = async (tmid: string, offset: number, previous?: IPaginationState) => {
	const page = await getThreadMessages({ tmid, offset });
	const deleted = previous && offset > 0 ? previous.total - page.total : 0;
	if (deleted <= 0) {
		return { ...page, offset };
	}
	const rewound = Math.max(0, offset - deleted);
	return { ...(await getThreadMessages({ tmid, offset: rewound })), offset: rewound };
};

const fetchPage = async (thread: IThreadLocation, pager: IThreadPager, requestedOffset: number): Promise<boolean> => {
	const previous = pager.state;
	try {
		const { messages, total, threadParent, offset } = await requestPage(thread.tmid, requestedOffset, previous);
		if (pagination.get(thread.tmid) !== pager) {
			return false;
		}
		const loaded = offset + messages.length;
		const fullyPaged = !messages.length || loaded >= total;
		const oldest = messages.at(-1);
		pager.state = {
			loaded,
			total,
			fullyPaged,
			oldestTs: oldest ? tsToMs(oldest.ts) : Infinity,
			reachedOldest: !!previous?.reachedOldest || fullyPaged
		};
		await saveThreadMessages({ ...thread, messages: threadParent ? [threadParent, ...messages] : messages });
		return messages.length > 0;
	} catch (e) {
		log(e);
		pager.state = previous;
		return false;
	}
};

const track = (tmid: string, run: () => Promise<boolean>): Promise<boolean> => {
	const pending = inFlight.get(tmid);
	const request: Promise<boolean> = (async () => {
		await pending;
		const result = await run();
		loadedListeners.forEach(listener => listener());
		return result;
	})().finally(() => {
		if (inFlight.get(tmid) === request) {
			inFlight.delete(tmid);
		}
	});
	inFlight.set(tmid, request);
	return request;
};

const loadFirstPage = (thread: IThreadLocation): Promise<boolean> => {
	const pager = pagerFor(thread.tmid);
	if (!pager.firstPage) {
		pager.firstPage = track(thread.tmid, () => fetchPage(thread, pager, 0)).finally(() => {
			pager.firstPage = undefined;
		});
	}
	return pager.firstPage;
};

const loadNextPage = (thread: IThreadLocation): Promise<boolean> => {
	const pager = pagerFor(thread.tmid);
	if (!pager.state) {
		return loadFirstPage(thread);
	}
	return track(thread.tmid, () => {
		const { state } = pager;
		return state && !state.fullyPaged ? fetchPage(thread, pager, state.loaded) : Promise.resolve(false);
	});
};

export async function loadThreadMessages(thread: IThreadLocation): Promise<void> {
	await loadFirstPage(thread);
}

export async function loadOlderThreadMessages(thread: IThreadLocation): Promise<void> {
	await loadNextPage(thread);
}

const hasPagedTo = async (tmid: string, target: IThreadMessageTarget): Promise<boolean> => {
	const state = pagination.get(tmid)?.state;
	if (target.id === tmid) {
		return state?.reachedOldest === true;
	}
	if (!state) {
		return false;
	}
	const targetTs = tsToMs(target.ts);
	if (state.reachedOldest || targetTs > state.oldestTs) {
		return true;
	}
	return targetTs === state.oldestTs && !!(await getThreadMessageById(target.id));
};

export const loadThreadMessagesUntil = async (
	thread: IThreadLocation,
	target: IThreadMessageTarget,
	isWanted: () => boolean
): Promise<boolean> => {
	await inFlight.get(thread.tmid);
	let fetched = true;
	while (fetched && isWanted() && !(await hasPagedTo(thread.tmid, target))) {
		fetched = await loadNextPage(thread);
	}
	if (!(await hasPagedTo(thread.tmid, target))) {
		return false;
	}
	return target.id === thread.tmid || !!(await getThreadMessageById(target.id));
};

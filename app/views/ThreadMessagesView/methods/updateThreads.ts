import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { type IMessage, type TSubscriptionModel, type TThreadModel } from '~/definitions';
import database from '~/lib/database';
import protectedFunction from '~/lib/methods/helpers/protectedFunction';
import buildMessage from '~/lib/methods/helpers/buildMessage';
import log from '~/lib/methods/helpers/log';
import { type TThreadRow } from '../types';

const buildThreads = (threads: IMessage[]) =>
	threads.map(thread => buildMessage(thread)).filter((thread): thread is IMessage => thread !== null);

const persistThreads = async ({
	subscription,
	builtThreads,
	remove,
	lastThreadSync
}: {
	subscription: TSubscriptionModel;
	builtThreads: IMessage[];
	remove?: IMessage[];
	lastThreadSync: Date;
}) => {
	const db = database.active;
	const threadsCollection = db.get('threads');
	const storedThreads = await subscription.threads.fetch();
	const isStored = (thread: IMessage) => storedThreads.some(storedThread => storedThread.id === thread._id);

	const threadsToDelete = storedThreads
		.filter(storedThread => remove?.some(removed => removed._id === storedThread.id))
		.map(storedThread => storedThread.prepareDestroyPermanently());
	const threadsToCreate = builtThreads
		.filter(thread => !isStored(thread))
		.map(thread =>
			threadsCollection.prepareCreate(
				protectedFunction((record: any) => {
					record._raw = sanitizedRaw({ id: thread._id }, threadsCollection.schema);
					record.subscription.set(subscription);
					Object.assign(record, thread);
				})
			)
		);
	const threadsToUpdate = storedThreads.flatMap(storedThread => {
		const builtThread = builtThreads.find(thread => thread._id === storedThread.id);
		if (!builtThread) {
			return [];
		}
		try {
			return [storedThread.prepareUpdate(protectedFunction((record: TThreadModel) => Object.assign(record, builtThread)))];
		} catch {
			return [];
		}
	});

	await db.write(async () => {
		await db.batch(
			...threadsToCreate,
			...threadsToUpdate,
			...threadsToDelete,
			subscription.prepareUpdate(record => {
				record.lastThreadSync = lastThreadSync;
			})
		);
	});
};

const updateThreads = async ({
	subscription,
	update,
	remove,
	lastThreadSync
}: {
	subscription: TSubscriptionModel | null;
	update: IMessage[];
	remove?: IMessage[];
	lastThreadSync: Date;
}): Promise<TThreadRow[]> => {
	const builtThreads = buildThreads(update);
	if (!subscription) {
		return builtThreads.map(thread => ({ ...thread, id: thread._id }));
	}
	try {
		await persistThreads({ subscription, builtThreads, remove, lastThreadSync });
	} catch (e) {
		log(e);
	}
	return [];
};

export default updateThreads;

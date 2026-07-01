import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { type IMessage, type TSubscriptionModel, type TThreadModel } from '../../../definitions';
import database from '../../../lib/database';
import protectedFunction from '../../../lib/methods/helpers/protectedFunction';
import buildMessage from '../../../lib/methods/helpers/buildMessage';
import log from '../../../lib/methods/helpers/log';

const updateThreads = async ({
	subscription,
	update,
	remove,
	lastThreadSync
}: {
	subscription?: TSubscriptionModel;
	update: IMessage[];
	remove?: IMessage[];
	lastThreadSync: Date;
}): Promise<IMessage[] | undefined> => {
	const built = update.map(m => buildMessage(m)) as IMessage[];

	// Without a subscription there's nothing to persist against, so return the
	// built threads for the caller to keep in local state. sync is never called here.
	if (!subscription?._id) {
		return built;
	}

	try {
		const db = database.active;
		const threadsCollection = db.get('threads');
		const allThreadsRecords = await subscription.threads.fetch();

		let threadsToCreate: TThreadModel[] = [];
		let threadsToUpdate: (TThreadModel | null | undefined)[] = [];
		let threadsToDelete: TThreadModel[] = [];

		if (remove && remove.length) {
			threadsToDelete = allThreadsRecords.filter((i1: { id: string }) => remove.find(i2 => i1.id === i2._id));
			threadsToDelete = threadsToDelete.map(t => t.prepareDestroyPermanently());
		}

		if (built.length) {
			threadsToCreate = built.filter(i1 => !allThreadsRecords.find((i2: { id: string }) => i1._id === i2.id)) as TThreadModel[];
			threadsToUpdate = allThreadsRecords.filter((i1: { id: string }) => built.find(i2 => i1.id === i2._id));
			threadsToCreate = threadsToCreate.map(thread =>
				threadsCollection.prepareCreate(
					// The raw WatermelonDB record exposes the subscription relation setter, which the
					// IThread type models as a plain value, so this callback can't be typed as TThreadModel.
					protectedFunction((t: any) => {
						t._raw = sanitizedRaw({ id: thread._id }, threadsCollection.schema);
						t.subscription.set(subscription);
						Object.assign(t, thread);
					})
				)
			);
			threadsToUpdate = threadsToUpdate.map(thread => {
				const newThread = built.find(t => t._id === thread?.id);
				try {
					return thread?.prepareUpdate(
						protectedFunction((t: TThreadModel) => {
							Object.assign(t, newThread);
						})
					);
				} catch {
					return null;
				}
			});
		}

		await db.write(async () => {
			await db.batch(
				...threadsToCreate,
				...threadsToUpdate,
				...threadsToDelete,
				subscription.prepareUpdate((s: TSubscriptionModel) => {
					s.lastThreadSync = lastThreadSync;
				})
			);
		});
	} catch (e) {
		log(e);
	}
};

export default updateThreads;

import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { IMessage, TThreadModel } from '../../../definitions';
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
	subscription: any;
	update: IMessage[];
	remove?: IMessage[];
	lastThreadSync: Date;
}) => {
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

		if (update && update.length) {
			update = update.map(m => buildMessage(m)) as IMessage[];
			// filter threads
			threadsToCreate = update.filter(i1 => !allThreadsRecords.find((i2: { id: string }) => i1._id === i2.id)) as TThreadModel[];
			threadsToUpdate = allThreadsRecords.filter((i1: { id: string }) => update.find(i2 => i1.id === i2._id));
			threadsToCreate = threadsToCreate.map(thread =>
				threadsCollection.prepareCreate(
					protectedFunction((t: any) => {
						t._raw = sanitizedRaw({ id: thread._id }, threadsCollection.schema);
						t.subscription.set(subscription);
						Object.assign(t, thread);
					})
				)
			);
			threadsToUpdate = threadsToUpdate.map(thread => {
				const newThread = update.find(t => t._id === thread?.id);
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
				subscription.prepareUpdate((s: any) => {
					s.lastThreadSync = lastThreadSync;
				})
			);
		});
	} catch (e) {
		console.log('chega aqui nop erro', e);
		log(e);
	}
};

export default updateThreads;

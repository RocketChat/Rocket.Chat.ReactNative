import { type Collection, type Model } from '@nozbe/watermelondb';
import { sanitizedRaw, type DirtyRaw } from '@nozbe/watermelondb/RawRecord';

import appSchema from '../../../../lib/database/schema/app';
import Subscription from '../../../../lib/database/model/Subscription';
import { type TSubscriptionModel } from '../../../../definitions';
import { createRoomStore, observeRoom } from '../RoomStore';
import { setupObserveRoomDatabase } from './observeRoomHarness';

const subscriptionsSchema = appSchema.tables.subscriptions;

export const subscriptionFixture: DirtyRaw = {
	id: 'sub-1',
	_id: 'sub-1',
	rid: 'rid-1',
	t: 'c',
	name: 'general',
	fname: 'general',
	roles: JSON.stringify(['owner'])
};

export const createSubscriptionRecord = (raw: DirtyRaw = subscriptionFixture): TSubscriptionModel => {
	const collection = {
		schema: subscriptionsSchema,
		table: subscriptionsSchema.name,
		database: {}
	} as unknown as Collection<Model>;
	const record = new Subscription(collection, sanitizedRaw({ _status: 'synced', ...raw }, subscriptionsSchema));
	return record as unknown as TSubscriptionModel;
};

export const writeColumn = (record: TSubscriptionModel, column: string, value: unknown) => {
	const model = record as unknown as { _isEditing: boolean; _setRaw: (column: string, value: unknown) => void };
	model._isEditing = true;
	try {
		model._setRaw(column, value);
	} finally {
		model._isEditing = false;
	}
};

export const setupRealSubscriptionObservation = ({
	rid = 'rid-1',
	record = createSubscriptionRecord()
}: { rid?: string; record?: TSubscriptionModel } = {}) => {
	const observedDatabase = setupObserveRoomDatabase();
	const store = createRoomStore({ rid, initialRoom: record });
	const snapshots = [store.getState().room];
	store.subscribe(state => {
		if (state.room !== snapshots[snapshots.length - 1]) {
			snapshots.push(state.room);
		}
	});
	const detach = observeRoom(rid, store);
	return {
		store,
		record,
		detach,
		emit: observedDatabase.emit,
		observeWithColumns: observedDatabase.observeWithColumns,
		snapshotCount: () => snapshots.length
	};
};

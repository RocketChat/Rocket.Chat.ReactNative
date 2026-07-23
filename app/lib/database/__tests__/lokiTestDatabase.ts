import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import type { TSubscriptionModel, TMessageModel } from '../../../definitions';
import { SubscriptionType } from '../../../definitions';
import appSchema from '../schema/app';
import migrations from '../model/migrations';
import Subscription from '../model/Subscription';
import Room from '../model/Room';
import Message from '../model/Message';
import Thread from '../model/Thread';
import ThreadMessage from '../model/ThreadMessage';
import CustomEmoji from '../model/CustomEmoji';
import FrequentlyUsedEmoji from '../model/FrequentlyUsedEmoji';
import Upload from '../model/Upload';
import Setting from '../model/Setting';
import Role from '../model/Role';
import Permission from '../model/Permission';
import SlashCommand from '../model/SlashCommand';
import User from '../model/User';
import type { TAppDatabase } from '../interfaces';

/**
 * Builds a real WatermelonDB `Database` backed by an in-memory LokiJS adapter,
 * over the production `appSchema`. Everything WatermelonDB (the JS core, the
 * writer lock, `db.write` serialization, queries) is real — only persistence is
 * swapped from native SQLite to LokiJS, so integration tests can exercise the
 * sync/subscription code without a native bridge.
 *
 * `useWebWorker: false` keeps the adapter in-process (no worker file to resolve
 * under Jest); `useIncrementalIndexedDB: false` keeps it in-memory (no IndexedDB
 * shims needed in the node test environment).
 */
export const createLokiTestDatabase = (): TAppDatabase => {
	const adapter = new LokiJSAdapter({
		schema: appSchema,
		migrations,
		useWebWorker: false,
		useIncrementalIndexedDB: false
	});

	return new Database({
		adapter,
		modelClasses: [
			Subscription,
			Room,
			Message,
			Thread,
			ThreadMessage,
			CustomEmoji,
			FrequentlyUsedEmoji,
			Upload,
			Setting,
			Role,
			Permission,
			SlashCommand,
			User
		]
	}) as TAppDatabase;
};

/** Truncates every collection so a single database instance can be reused across tests. */
export const resetLokiTestDatabase = async (database: Database): Promise<void> => {
	await database.write(async () => {
		await database.unsafeResetDatabase();
	});
};

export interface ISeedSubscription {
	id?: string;
	rid?: string;
	name?: string;
	fname?: string;
	t?: string;
	lastOpen?: Date;
	encrypted?: boolean;
	E2EKey?: string;
}

/** Creates a `subscriptions` record with sensible defaults; override any field. */
export const seedSubscription = (database: TAppDatabase, overrides: ISeedSubscription = {}): Promise<TSubscriptionModel> => {
	const rid = overrides.rid ?? overrides.id ?? 'room-1';
	return database.write(() =>
		database.get('subscriptions').create(record => {
			record._raw.id = overrides.id ?? rid;
			record._id = overrides.id ?? rid;
			record.rid = rid;
			record.name = overrides.name ?? 'test-room';
			record.fname = overrides.fname ?? overrides.name ?? 'test-room';
			record.t = (overrides.t ?? 'c') as SubscriptionType;
			record.open = true;
			if (overrides.lastOpen) {
				record.lastOpen = overrides.lastOpen;
			}
			if (overrides.encrypted !== undefined) {
				record.encrypted = overrides.encrypted;
			}
			if (overrides.E2EKey !== undefined) {
				record.E2EKey = overrides.E2EKey;
			}
		})
	);
};

export interface ISeedMessage {
	id?: string;
	rid?: string;
	msg?: string;
	ts?: Date;
	updatedAt?: Date;
	u?: { _id: string; username: string };
	tmid?: string;
}

/** Creates a `messages` record with sensible defaults; override any field. */
export const seedMessage = (database: TAppDatabase, overrides: ISeedMessage = {}): Promise<TMessageModel> => {
	const rid = overrides.rid ?? 'room-1';
	const ts = overrides.ts ?? new Date();
	return database.write(() =>
		database.get('messages').create(record => {
			if (overrides.id) {
				record._raw.id = overrides.id;
			}
			record.subscription!.id = rid;
			record.msg = overrides.msg ?? 'hello';
			record.ts = ts;
			record._updatedAt = overrides.updatedAt ?? ts;
			record.u = overrides.u ?? { _id: 'user-1', username: 'user-1' };
			if (overrides.tmid) {
				record.tmid = overrides.tmid;
			}
		})
	);
};

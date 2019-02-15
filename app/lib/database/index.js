import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { serverSchema, appSchema } from './schemas';
import { Server, Setting } from './models';

const serverAdapter = new SQLiteAdapter({
	dbName: 'ServersDB',
	schema: serverSchema
});

export const serverDatabase = new Database({
	adapter: serverAdapter,
	modelClasses: [Server]
});

const appAdapter = new SQLiteAdapter({
	dbName: 'AppDB',
	schema: appSchema
});

export const appDatabase = new Database({
	adapter: appAdapter,
	modelClasses: [Setting]
});


// serverDatabase.unsafeResetDatabase();
// appDatabase.unsafeResetDatabase();
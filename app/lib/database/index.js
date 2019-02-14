import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { serverSchema } from './schemas';
import { Server } from './models';

const adapter = new SQLiteAdapter({
	dbName: 'ServersDB',
	schema: serverSchema
});

export const serverDatabase = new Database({
	adapter,
	modelClasses: [Server]
});

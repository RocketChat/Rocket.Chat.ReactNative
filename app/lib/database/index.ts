import { Database } from './facade';
import { openServersDb, openServerDb } from './driver/connection';
import { installNativeKeychainShim } from './driver/keyStore';
import { appTableMap, appModelMap, serversTableMap, serversModelMap } from './tableMaps';
import serversSchema from './schema/servers';
import appSchema from './schema/app';
import { type TAppDatabase, type TServerDatabase } from './interfaces';

/**
 * Opens (or returns the cached handle for) the per-server app database and wraps it
 * in a fresh facade Database. Used for one-off resets where the target server is not
 * necessarily the active one (see logout).
 */
export const getDatabase = async (database = ''): Promise<TAppDatabase> => {
	const handle = await openServerDb(database);
	return new Database(handle, appSchema, appTableMap, appModelMap) as unknown as TAppDatabase;
};

interface IDatabases {
	serversDB?: TServerDatabase;
	activeDB?: TAppDatabase;
}

class DB {
	databases: IDatabases = {};

	get active(): TAppDatabase {
		if (!this.databases.activeDB) {
			throw new Error('Active database accessed before setActiveDB() resolved');
		}
		return this.databases.activeDB;
	}

	get servers(): TServerDatabase {
		if (!this.databases.serversDB) {
			throw new Error('Servers database accessed before initServers() resolved');
		}
		return this.databases.serversDB;
	}

	/**
	 * Installs the native key shim and opens the global servers database.
	 * Must resolve before any consumer reads `database.servers`.
	 * Arrow field so `yield call(database.initServers)` keeps its `this`.
	 */
	initServers = async (): Promise<void> => {
		if (this.databases.serversDB) {
			return;
		}
		installNativeKeychainShim();
		const handle = await openServersDb();
		this.databases.serversDB = new Database(
			handle,
			serversSchema,
			serversTableMap,
			serversModelMap
		) as unknown as TServerDatabase;
	};

	setActiveDB = async (database = ''): Promise<void> => {
		const handle = await openServerDb(database);
		this.databases.activeDB = new Database(handle, appSchema, appTableMap, appModelMap) as unknown as TAppDatabase;
	};
}

const db = new DB();
export default db;

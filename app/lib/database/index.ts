import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import logger from '@nozbe/watermelondb/utils/common/logger';

import { appGroupPath } from '../methods/appGroup';
import { isOfficial } from '../constants/environment';
import Subscription from './model/Subscription';
import Room from './model/Room';
import Message from './model/Message';
import Thread from './model/Thread';
import ThreadMessage from './model/ThreadMessage';
import CustomEmoji from './model/CustomEmoji';
import FrequentlyUsedEmoji from './model/FrequentlyUsedEmoji';
import Upload from './model/Upload';
import Setting from './model/Setting';
import Role from './model/Role';
import Permission from './model/Permission';
import SlashCommand from './model/SlashCommand';
import User from './model/User';
import LoggedUser from './model/servers/User';
import Server from './model/servers/Server';
import ServersHistory from './model/ServersHistory';
import serversSchema from './schema/servers';
import appSchema from './schema/app';
import migrations from './model/migrations';
import serversMigrations from './model/servers/migrations';
import { TAppDatabase, TServerDatabase } from './interfaces';

if (__DEV__) {
	console.log(`📂 ${appGroupPath}`);
}

const getDatabasePath = (name: string) => `${appGroupPath}${name}${isOfficial ? '' : '-experimental'}.db`;

export const getDatabase = (database = ''): Database => {
	const path = database.replace(/(^\w+:|^)\/\//, '').replace(/\//g, '.');
	const dbName = getDatabasePath(path);

	const adapter = new SQLiteAdapter({
		dbName,
		schema: appSchema,
		migrations,
		jsi: true
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
	});
};

interface IDatabases {
	serversDB: TServerDatabase;
	activeDB?: TAppDatabase;
}

class DB {
	databases: IDatabases = {
		serversDB: new Database({
			adapter: new SQLiteAdapter({
				dbName: getDatabasePath('default'),
				schema: serversSchema,
				migrations: serversMigrations,
				jsi: true
			}),
			modelClasses: [Server, LoggedUser, ServersHistory]
		}) as TServerDatabase
	};

	get active(): TAppDatabase {
		return this.databases.activeDB!;
	}

	get servers() {
		return this.databases.serversDB;
	}

	setActiveDB(database: string) {
		this.databases.activeDB = getDatabase(database) as TAppDatabase;
	}
}

const db = new DB();
export default db;

if (!__DEV__) {
	logger.silence();
}

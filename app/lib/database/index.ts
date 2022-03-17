import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import logger from '@nozbe/watermelondb/utils/common/logger';

import { isIOS } from '../../utils/deviceInfo';
import appGroup from '../../utils/appGroup';
import { isOfficial } from '../../constants/environment';
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

const appGroupPath = isIOS ? appGroup.path : '';

if (__DEV__ && isIOS) {
	console.log(appGroupPath);
}

const getDatabasePath = (name: string) => `${appGroupPath}${name}${isOfficial ? '' : '-experimental'}.db`;

export const getDatabase = (database = ''): Database => {
	const path = database.replace(/(^\w+:|^)\/\//, '').replace(/\//g, '.');
	const dbName = getDatabasePath(path);

	const adapter = new SQLiteAdapter({
		dbName,
		schema: appSchema,
		migrations
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
	shareDB?: TAppDatabase | null;
	serversDB: TServerDatabase;
	activeDB?: TAppDatabase;
}

class DB {
	databases: IDatabases = {
		serversDB: new Database({
			adapter: new SQLiteAdapter({
				dbName: getDatabasePath('default'),
				schema: serversSchema,
				migrations: serversMigrations
			}),
			modelClasses: [Server, LoggedUser, ServersHistory]
		}) as TServerDatabase
	};

	// Expected at least one database
	get active(): TAppDatabase {
		return this.databases.shareDB || this.databases.activeDB!;
	}

	get share() {
		return this.databases.shareDB;
	}

	set share(db) {
		this.databases.shareDB = db;
	}

	get servers() {
		return this.databases.serversDB;
	}

	setShareDB(database = '') {
		const path = database.replace(/(^\w+:|^)\/\//, '').replace(/\//g, '.');
		const dbName = getDatabasePath(path);

		const adapter = new SQLiteAdapter({
			dbName,
			schema: appSchema,
			migrations
		});

		this.databases.shareDB = new Database({
			adapter,
			modelClasses: [
				Subscription,
				Message,
				Thread,
				ThreadMessage,
				Upload,
				Permission,
				CustomEmoji,
				FrequentlyUsedEmoji,
				Setting,
				User
			]
		}) as TAppDatabase;
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

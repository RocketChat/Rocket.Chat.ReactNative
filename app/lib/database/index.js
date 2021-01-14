import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import logger from '@nozbe/watermelondb/utils/common/logger';

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

import { isIOS } from '../../utils/deviceInfo';
import appGroup from '../../utils/appGroup';
import { isOfficial } from '../../constants/environment';

const appGroupPath = isIOS ? appGroup.path : '';

if (__DEV__ && isIOS) {
	console.log(appGroupPath);
}

const getDatabasePath = name => `${ appGroupPath }${ name }${ isOfficial ? '' : '-experimental' }.db`;

export const getDatabase = (database = '') => {
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
		],
		actionsEnabled: true
	});
};

class DB {
	databases = {
		serversDB: new Database({
			adapter: new SQLiteAdapter({
				dbName: getDatabasePath('default'),
				schema: serversSchema,
				migrations: serversMigrations
			}),
			modelClasses: [Server, LoggedUser, ServersHistory],
			actionsEnabled: true
		})
	}

	get active() {
		return this.databases.shareDB || this.databases.activeDB;
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
			],
			actionsEnabled: true
		});
	}

	setActiveDB(database) {
		this.databases.activeDB = getDatabase(database);
	}
}

const db = new DB();
export default db;

if (!__DEV__) {
	logger.silence();
}

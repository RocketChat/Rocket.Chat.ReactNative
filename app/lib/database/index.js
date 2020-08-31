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
import Server from './model/Server';

import serversSchema from './schema/servers';
import appSchema from './schema/app';

import migrations from './model/migrations';

import serversMigrations from './model/serversMigrations';

import { isIOS } from '../../utils/deviceInfo';
import appGroup from '../../utils/appGroup';

const appGroupPath = isIOS ? appGroup.path : '';

if (__DEV__ && isIOS) {
	console.log(appGroupPath);
}

export const getDatabase = (database = '') => {
	const path = database.replace(/(^\w+:|^)\/\//, '').replace(/\//g, '.');
	const dbName = `${ appGroupPath }${ path }.db`;

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
			SlashCommand
		],
		actionsEnabled: true
	});
};

class DB {
	databases = {
		serversDB: new Database({
			adapter: new SQLiteAdapter({
				dbName: `${ appGroupPath }default.db`,
				schema: serversSchema,
				migrations: serversMigrations
			}),
			modelClasses: [Server, User],
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
		const dbName = `${ appGroupPath }${ path }.db`;

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
				FrequentlyUsedEmoji
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

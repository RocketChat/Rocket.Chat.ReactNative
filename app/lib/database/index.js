import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import RNRealmPath from 'react-native-realm-path';

import schema from './model/schema';
import Subscription from './model/Subscription';
import Message from './model/Message';
import Thread from './model/Thread';
import ThreadMessage from './model/ThreadMessage';
import CustomEmoji from './model/CustomEmoji';
import FrequentlyUsedEmoji from './model/FrequentlyUsedEmoji';
import Upload from './model/Upload';
import Setting from './model/Setting';

import servers from './model/servers';
import User from './model/User';
import Server from './model/Server';

class DB {
	databases = {
		serversDB: new Database({
			adapter: new SQLiteAdapter({
				dbName: `${ RNRealmPath.realmPath }default.db`,
				schema: servers
			}),
			modelClasses: [Server, User],
			actionsEnabled: true
		})
	}

	get database() {
		return this.databases.activeDB;
	}

	action(...args) {
		return this.database.action(...args);
	}

	setActiveDB(database = '') {
		const path = database.replace(/(^\w+:|^)\/\//, '');
		const dbName = `${ RNRealmPath.realmPath }${ path }.db`;

		const adapter = new SQLiteAdapter({
			dbName,
			schema
		});

		this.databases.activeDB = new Database({
			adapter,
			modelClasses: [
				Subscription,
				Message,
				Thread,
				ThreadMessage,
				CustomEmoji,
				FrequentlyUsedEmoji,
				Upload,
				Setting
			],
			actionsEnabled: true
		});
	}
}

const db = new DB();
export default db;

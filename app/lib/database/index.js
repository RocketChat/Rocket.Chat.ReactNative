import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import RNRealmPath from 'react-native-realm-path';

import schema from './model/schema';
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
import Command from './model/Command';

import servers from './model/servers';
import User from './model/User';
import Server from './model/Server';

import memorySchema from './model/memorySchema';
import UserTyping from './model/UserTyping';
import { isIOS } from '../../utils/deviceInfo';

class DB {
	databases = {
		serversDB: new Database({
			adapter: new SQLiteAdapter({
				dbName: `${ RNRealmPath.realmPath }default.db`,
				schema: servers
			}),
			modelClasses: [Server, User],
			actionsEnabled: true
		}),
		inMemoryDB: new Database({
			adapter: new SQLiteAdapter({
				dbName: isIOS ? 'file::memory:' : ':memory:',
				schema: memorySchema
			}),
			modelClasses: [UserTyping],
			actionsEnabled: true
		})
	}

	get database() {
		return this.databases.activeDB;
	}

	get memoryDatabase() {
		return this.databases.inMemoryDB;
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
				Command
			],
			actionsEnabled: true
		});
	}
}

const db = new DB();
export default db;

// eslint-disable-next-line no-unused-vars
const r = db.memoryDatabase.collections.get('users_typing').query().fetch().then(console.log)
	.catch(console.log);

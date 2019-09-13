import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import RNFetchBlob from 'rn-fetch-blob';

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

import { isIOS } from '../../utils/deviceInfo';

const appGroupPath = isIOS ? `${ RNFetchBlob.fs.syncPathAppGroup('group.ios.chat.rocket') }/` : '';

if (__DEV__ && isIOS) {
	console.log(appGroupPath);
}

class DB {
	databases = {
		serversDB: new Database({
			adapter: new SQLiteAdapter({
				dbName: `${ appGroupPath }default.db`,
				schema: serversSchema
			}),
			modelClasses: [Server, User],
			actionsEnabled: true
		})
	}

	get active() {
		return this.databases.activeDB;
	}

	get servers() {
		return this.databases.serversDB;
	}

	setActiveDB(database = '') {
		const path = database.replace(/(^\w+:|^)\/\//, '');
		const dbName = `${ appGroupPath }${ path }.db`;

		const adapter = new SQLiteAdapter({
			dbName,
			schema: appSchema
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
				SlashCommand
			],
			actionsEnabled: true
		});
	}
}

const db = new DB();
export default db;

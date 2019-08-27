import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './model/schema';
import Subscription from './model/Subscription' // ⬅️ You'll import your Models here
import Message from './model/Message' // ⬅️ You'll import your Models here

const adapter = new SQLiteAdapter({
	dbName: 'WatermelonDemo',
	schema,
})

const databaseWatermelon = new Database({
	adapter,
	modelClasses: [Subscription, Message],
	actionsEnabled: true,
})

// export default databaseWatermelon;

class DB {
	databases = {
		// activeDB: databaseWatermelon
	}

	get database() {
		return this.databases.activeDB;
	}

	collections(...args) {
		return this.database.collections(...args);
	}

	setActiveDB(database = '') {
		console.log('setActiveDB')
		// const path = database.replace(/(^\w+:|^)\/\//, '');
		this.databases.activeDB = new Database({
			adapter,
			modelClasses: [Subscription, Message],
			actionsEnabled: true,
		});
	}
}

const db = new DB();
export default db;

// const { database } = db;
// export { database };

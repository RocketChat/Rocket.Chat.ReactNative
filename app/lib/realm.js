import Realm from 'realm';

// import { AsyncStorage } from 'react-native';
// Realm.clearTestState();
// AsyncStorage.clear();

const serversSchema = {
	name: 'servers',
	primaryKey: 'id',
	properties: {
		id: 'string',
		current: 'bool'
	}
};

const settingsSchema = {
	name: 'settings',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		valueAsString: { type: 'string', optional: true },
		valueAsBoolean: { type: 'bool', optional: true },
		valueAsNumber: { type: 'int', optional: true },

		_updatedAt: { type: 'date', optional: true }
	}
};

const permissionsRolesSchema = {
	name: 'permissionsRoles',
	properties: {
		value: 'string'
	}
};

const permissionsSchema = {
	name: 'permissions',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		roles: { type: 'list', objectType: 'permissionsRoles' },
		_updatedAt: { type: 'date', optional: true }
	}
};

const roomsSchema = {
	name: 'rooms',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		t: 'string',
		lastMessage: 'messages',
		_updatedAt: { type: 'date', optional: true }
	}
};

const subscriptionRolesSchema = {
	name: 'subscriptionRolesSchema',
	properties: {
		value: 'string'
	}
};

const subscriptionSchema = {
	name: 'subscriptions',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		f: { type: 'bool', optional: true },
		t: 'string',
		ts: { type: 'date', optional: true },
		ls: { type: 'date', optional: true },
		name: 'string',
		fname: { type: 'string', optional: true },
		rid: 'string',
		open: { type: 'bool', optional: true },
		alert: { type: 'bool', optional: true },
		roles: { type: 'list', objectType: 'subscriptionRolesSchema' },
		unread: { type: 'int', optional: true },
		userMentions: { type: 'int', optional: true },
		// userMentions: 0,
		// groupMentions: 0,
		roomUpdatedAt: { type: 'date', optional: true },
		ro: { type: 'bool', optional: true }
	}
};

const usersSchema = {
	name: 'users',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		username: 'string',
		name: { type: 'string', optional: true }
	}
};

const attachmentFields = {
	name: 'attachmentFields',
	properties: {
		title: { type: 'string', optional: true },
		value: { type: 'string', optional: true },
		short: { type: 'bool', optional: true }
	}
};

const attachment = {
	name: 'attachment',
	properties: {
		description: { type: 'string', optional: true },
		image_size: { type: 'int', optional: true },
		image_type: { type: 'string', optional: true },
		image_url: { type: 'string', optional: true },
		audio_size: { type: 'int', optional: true },
		audio_type: { type: 'string', optional: true },
		audio_url: { type: 'string', optional: true },
		video_size: { type: 'int', optional: true },
		video_type: { type: 'string', optional: true },
		video_url: { type: 'string', optional: true },
		title: { type: 'string', optional: true },
		title_link: { type: 'string', optional: true },
		title_link_download: { type: 'bool', optional: true },
		type: { type: 'string', optional: true },
		author_icon: { type: 'string', optional: true },
		author_name: { type: 'string', optional: true },
		author_link: { type: 'string', optional: true },
		text: { type: 'string', optional: true },
		color: { type: 'string', optional: true },
		ts: { type: 'date', optional: true },
		attachments: { type: 'list', objectType: 'attachment' },
		fields: { type: 'list', objectType: 'attachmentFields' }
	}
};

const url = {
	name: 'url',
	properties: {
		_id: 'int',
		url: { type: 'string', optional: true },
		title: { type: 'string', optional: true },
		description: { type: 'string', optional: true },
		image: { type: 'string', optional: true }
	}
};


const messagesEditedBySchema = {
	name: 'messagesEditedBy',
	properties: {
		_id: { type: 'string', optional: true },
		username: { type: 'string', optional: true }
	}
};

const messagesSchema = {
	name: 'messages',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		msg: { type: 'string', optional: true },
		t: { type: 'string', optional: true },
		rid: 'string',
		ts: 'date',
		u: 'users',
		// mentions: [],
		// channels: [],
		alias: { type: 'string', optional: true },
		parseUrls: { type: 'bool', optional: true },
		groupable: { type: 'bool', optional: true },
		avatar: { type: 'string', optional: true },
		attachments: { type: 'list', objectType: 'attachment' },
		urls: { type: 'list', objectType: 'url' },
		_updatedAt: { type: 'date', optional: true },
		status: { type: 'int', optional: true },
		pinned: { type: 'bool', optional: true },
		starred: { type: 'bool', optional: true },
		editedBy: 'messagesEditedBy'
	}
};

const frequentlyUsedEmojiSchema = {
	name: 'frequentlyUsedEmoji',
	primaryKey: 'content',
	properties: {
		content: { type: 'string', optional: true },
		extension: { type: 'string', optional: true },
		isCustom: 'bool',
		count: 'int'
	}
};

const customEmojiAliasesSchema = {
	name: 'customEmojiAliases',
	properties: {
		value: 'string'
	}
};

const customEmojisSchema = {
	name: 'customEmojis',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		name: 'string',
		aliases: { type: 'list', objectType: 'customEmojiAliases' },
		extension: 'string',
		_updatedAt: { type: 'date', optional: true }
	}
};

const schema = [
	settingsSchema,
	subscriptionSchema,
	subscriptionRolesSchema,
	messagesSchema,
	usersSchema,
	roomsSchema,
	attachment,
	attachmentFields,
	messagesEditedBySchema,
	permissionsSchema,
	permissionsRolesSchema,
	url,
	frequentlyUsedEmojiSchema,
	customEmojiAliasesSchema,
	customEmojisSchema
];
class DB {
	databases = {
		serversDB: new Realm({
			path: 'default.realm',
			schema: [
				serversSchema
			],
			deleteRealmIfMigrationNeeded: true
		})
	};
	deleteAll(...args) {
		return this.database.write(() => this.database.deleteAll(...args));
	}
	write(...args) {
		return this.database.write(...args);
	}
	create(...args) {
		return this.database.create(...args);
	}
	objects(...args) {
		return this.database.objects(...args);
	}
	get database() {
		return this.databases.activeDB;
	}

	setActiveDB(database) {
		const path = database.replace(/(^\w+:|^)\/\//, '');
		return this.databases.activeDB = new Realm({
			path: `${ path }.realm`,
			schema,
			deleteRealmIfMigrationNeeded: true
		});
	}
}
export default new DB();

// realm.write(() => {
// 	realm.create('servers', { id: 'https://open.rocket.chat', current: false }, true);
// 	realm.create('servers', { id: 'http://localhost:3000', current: false }, true);
// 	realm.create('servers', { id: 'http://10.0.2.2:3000', current: false }, true);
// });

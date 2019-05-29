import Realm from 'realm';

// import { AsyncStorage } from 'react-native';
// Realm.clearTestState();
// AsyncStorage.clear();

const serversSchema = {
	name: 'servers',
	primaryKey: 'id',
	properties: {
		id: 'string',
		name: { type: 'string', optional: true },
		iconURL: { type: 'string', optional: true },
		roomsUpdatedAt: { type: 'date', optional: true },
		version: 'string?'
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

const permissionsSchema = {
	name: 'permissions',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		roles: 'string[]',
		_updatedAt: { type: 'date', optional: true }
	}
};

const roomsSchema = {
	name: 'rooms',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		broadcast: { type: 'bool', optional: true }
	}
};

const userMutedInRoomSchema = {
	name: 'usersMuted',
	primaryKey: 'value',
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
		name: { type: 'string', indexed: true },
		fname: { type: 'string', optional: true },
		rid: { type: 'string', indexed: true },
		open: { type: 'bool', optional: true },
		alert: { type: 'bool', optional: true },
		roles: 'string[]',
		unread: { type: 'int', optional: true },
		userMentions: { type: 'int', optional: true },
		roomUpdatedAt: { type: 'date', optional: true },
		ro: { type: 'bool', optional: true },
		lastOpen: { type: 'date', optional: true },
		lastMessage: { type: 'messages', optional: true },
		description: { type: 'string', optional: true },
		announcement: { type: 'string', optional: true },
		topic: { type: 'string', optional: true },
		blocked: { type: 'bool', optional: true },
		blocker: { type: 'bool', optional: true },
		reactWhenReadOnly: { type: 'bool', optional: true },
		archived: { type: 'bool', optional: true },
		joinCodeRequired: { type: 'bool', optional: true },
		notifications: { type: 'bool', optional: true },
		muted: { type: 'list', objectType: 'usersMuted' },
		broadcast: { type: 'bool', optional: true },
		prid: { type: 'string', optional: true },
		draftMessage: { type: 'string', optional: true },
		lastThreadSync: 'date?'
	}
};

const usersSchema = {
	name: 'users',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		username: 'string',
		name: { type: 'string', optional: true },
		avatarVersion: { type: 'int', optional: true }
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
		// title_link_download: { type: 'bool', optional: true },
		type: { type: 'string', optional: true },
		author_icon: { type: 'string', optional: true },
		author_name: { type: 'string', optional: true },
		author_link: { type: 'string', optional: true },
		text: { type: 'string', optional: true },
		color: { type: 'string', optional: true },
		ts: { type: 'date', optional: true },
		attachments: { type: 'list', objectType: 'attachment' },
		fields: {
			type: 'list', objectType: 'attachmentFields', default: []
		}
	}
};

const url = {
	name: 'url',
	primaryKey: 'url',
	properties: {
		// _id: { type: 'int', optional: true },
		url: { type: 'string', optional: true },
		title: { type: 'string', optional: true },
		description: { type: 'string', optional: true },
		image: { type: 'string', optional: true }
	}
};

const messagesReactionsUsernamesSchema = {
	name: 'messagesReactionsUsernames',
	primaryKey: 'value',
	properties: {
		value: 'string'
	}
};

const messagesReactionsSchema = {
	name: 'messagesReactions',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		emoji: 'string',
		usernames: { type: 'list', objectType: 'messagesReactionsUsernames' }
	}
};

const messagesEditedBySchema = {
	name: 'messagesEditedBy',
	primaryKey: '_id',
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
		rid: { type: 'string', indexed: true },
		ts: 'date',
		u: 'users',
		alias: { type: 'string', optional: true },
		parseUrls: { type: 'bool', optional: true },
		groupable: { type: 'bool', optional: true },
		avatar: { type: 'string', optional: true },
		attachments: { type: 'list', objectType: 'attachment' },
		urls: { type: 'list', objectType: 'url', default: [] },
		_updatedAt: { type: 'date', optional: true },
		status: { type: 'int', optional: true },
		pinned: { type: 'bool', optional: true },
		starred: { type: 'bool', optional: true },
		editedBy: 'messagesEditedBy',
		reactions: { type: 'list', objectType: 'messagesReactions' },
		role: { type: 'string', optional: true },
		drid: { type: 'string', optional: true },
		dcount: { type: 'int', optional: true },
		dlm: { type: 'date', optional: true },
		tmid: { type: 'string', optional: true },
		tcount: { type: 'int', optional: true },
		tlm: { type: 'date', optional: true },
		replies: 'string[]'
	}
};

const threadsSchema = {
	name: 'threads',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		msg: { type: 'string', optional: true },
		t: { type: 'string', optional: true },
		rid: { type: 'string', indexed: true },
		ts: 'date',
		u: 'users',
		alias: { type: 'string', optional: true },
		parseUrls: { type: 'bool', optional: true },
		groupable: { type: 'bool', optional: true },
		avatar: { type: 'string', optional: true },
		attachments: { type: 'list', objectType: 'attachment' },
		urls: { type: 'list', objectType: 'url', default: [] },
		_updatedAt: { type: 'date', optional: true },
		status: { type: 'int', optional: true },
		pinned: { type: 'bool', optional: true },
		starred: { type: 'bool', optional: true },
		editedBy: 'messagesEditedBy',
		reactions: { type: 'list', objectType: 'messagesReactions' },
		role: { type: 'string', optional: true },
		drid: { type: 'string', optional: true },
		dcount: { type: 'int', optional: true },
		dlm: { type: 'date', optional: true },
		tmid: { type: 'string', optional: true },
		tcount: { type: 'int', optional: true },
		tlm: { type: 'date', optional: true },
		replies: 'string[]',
		draftMessage: 'string?'
	}
};

const threadMessagesSchema = {
	name: 'threadMessages',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		msg: { type: 'string', optional: true },
		t: { type: 'string', optional: true },
		rid: { type: 'string', indexed: true },
		ts: 'date',
		u: 'users',
		alias: { type: 'string', optional: true },
		parseUrls: { type: 'bool', optional: true },
		groupable: { type: 'bool', optional: true },
		avatar: { type: 'string', optional: true },
		attachments: { type: 'list', objectType: 'attachment' },
		urls: { type: 'list', objectType: 'url', default: [] },
		_updatedAt: { type: 'date', optional: true },
		status: { type: 'int', optional: true },
		pinned: { type: 'bool', optional: true },
		starred: { type: 'bool', optional: true },
		editedBy: 'messagesEditedBy',
		reactions: { type: 'list', objectType: 'messagesReactions' },
		role: { type: 'string', optional: true }
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

const customEmojisSchema = {
	name: 'customEmojis',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		name: 'string',
		aliases: 'string[]',
		extension: 'string',
		_updatedAt: { type: 'date', optional: true }
	}
};

const rolesSchema = {
	name: 'roles',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		description: { type: 'string', optional: true }
	}
};

const uploadsSchema = {
	name: 'uploads',
	primaryKey: 'path',
	properties: {
		path: 'string',
		rid: 'string',
		name: { type: 'string', optional: true },
		description: { type: 'string', optional: true },
		size: { type: 'int', optional: true },
		type: { type: 'string', optional: true },
		store: { type: 'string', optional: true },
		progress: { type: 'int', default: 1 },
		error: { type: 'bool', default: false }
	}
};

const usersTypingSchema = {
	name: 'usersTyping',
	properties: {
		rid: { type: 'string', indexed: true },
		username: { type: 'string', optional: true }
	}
};

const activeUsersSchema = {
	name: 'activeUsers',
	primaryKey: 'id',
	properties: {
		id: 'string',
		name: 'string?',
		username: 'string?',
		status: 'string?',
		utcOffset: 'double?'
	}
};

const schema = [
	settingsSchema,
	subscriptionSchema,
	messagesSchema,
	threadsSchema,
	threadMessagesSchema,
	usersSchema,
	roomsSchema,
	attachment,
	attachmentFields,
	messagesEditedBySchema,
	permissionsSchema,
	url,
	frequentlyUsedEmojiSchema,
	customEmojisSchema,
	messagesReactionsSchema,
	messagesReactionsUsernamesSchema,
	rolesSchema,
	userMutedInRoomSchema,
	uploadsSchema
];

const inMemorySchema = [usersTypingSchema, activeUsersSchema];

class DB {
	databases = {
		serversDB: new Realm({
			path: 'default.realm',
			schema: [
				serversSchema
			],
			schemaVersion: 6,
			migration: (oldRealm, newRealm) => {
				if (oldRealm.schemaVersion >= 1 && newRealm.schemaVersion <= 6) {
					const newServers = newRealm.objects('servers');

					// eslint-disable-next-line no-plusplus
					for (let i = 0; i < newServers.length; i++) {
						newServers[i].roomsUpdatedAt = null;
					}
				}
			}
		}),
		inMemoryDB: new Realm({
			path: 'memory.realm',
			schema: inMemorySchema,
			schemaVersion: 2,
			inMemory: true
		})
	}

	deleteAll(...args) {
		return this.database.write(() => this.database.deleteAll(...args));
	}

	delete(...args) {
		return this.database.delete(...args);
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

	objectForPrimaryKey(...args) {
		return this.database.objectForPrimaryKey(...args);
	}

	get database() {
		return this.databases.activeDB;
	}

	get memoryDatabase() {
		return this.databases.inMemoryDB;
	}

	setActiveDB(database = '') {
		const path = database.replace(/(^\w+:|^)\/\//, '');
		return this.databases.activeDB = new Realm({
			path: `${ path }.realm`,
			schema,
			schemaVersion: 9,
			migration: (oldRealm, newRealm) => {
				if (oldRealm.schemaVersion >= 3 && newRealm.schemaVersion <= 8) {
					const newSubs = newRealm.objects('subscriptions');

					// eslint-disable-next-line no-plusplus
					for (let i = 0; i < newSubs.length; i++) {
						newSubs[i].lastOpen = null;
						newSubs[i].ls = null;
					}
					const newMessages = newRealm.objects('messages');
					newRealm.delete(newMessages);
					const newThreads = newRealm.objects('threads');
					newRealm.delete(newThreads);
					const newThreadMessages = newRealm.objects('threadMessages');
					newRealm.delete(newThreadMessages);
				}
				if (newRealm.schemaVersion === 9) {
					const newSubs = newRealm.objects('subscriptions');
					newRealm.delete(newSubs);
					const newEmojis = newRealm.objects('customEmojis');
					newRealm.delete(newEmojis);
					const newSettings = newRealm.objects('settings');
					newRealm.delete(newSettings);
				}
			}
		});
	}
}
const db = new DB();
export default db;

// Realm workaround for "Cannot create asynchronous query while in a write transaction"
// inpired from https://github.com/realm/realm-js/issues/1188#issuecomment-359223918
export function safeAddListener(results, callback, database = db) {
	if (!results || !results.addListener) {
		console.log('⚠️ safeAddListener called for non addListener-compliant object');
		return;
	}

	if (database.isInTransaction) {
		setTimeout(() => {
			safeAddListener(results, callback);
		}, 50);
	} else {
		results.addListener(callback);
	}
}

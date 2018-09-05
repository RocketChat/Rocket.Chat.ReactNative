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
		iconURL: { type: 'string', optional: true }
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
	primaryKey: 'value',
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
		broadcast: { type: 'bool', optional: true }
	}
};

const subscriptionRolesSchema = {
	name: 'subscriptionRolesSchema',
	primaryKey: 'value',
	properties: {
		value: 'string'
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
		roles: { type: 'list', objectType: 'subscriptionRolesSchema' },
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
		broadcast: { type: 'bool', optional: true }
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
	primaryKey: 'emoji',
	properties: {
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
		// mentions: [],
		// channels: [],
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

const customEmojiAliasesSchema = {
	name: 'customEmojiAliases',
	primaryKey: 'value',
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
	customEmojisSchema,
	messagesReactionsSchema,
	messagesReactionsUsernamesSchema,
	rolesSchema,
	userMutedInRoomSchema,
	uploadsSchema
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
	get database() {
		return this.databases.activeDB;
	}

	setActiveDB(database = '') {
		const path = database.replace(/(^\w+:|^)\/\//, '');
		return this.databases.activeDB = new Realm({
			path: `${ path }.realm`,
			schema,
			deleteRealmIfMigrationNeeded: true
		});
	}
}
export default new DB();

import Realm from 'realm';
// import { AsyncStorage } from 'react-native';

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
		_server: 'servers',
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
		_server: 'servers',
		roles: { type: 'list', objectType: 'permissionsRoles' },
		_updatedAt: { type: 'date', optional: true }
	}
};

const roomsSchema = {
	name: 'rooms',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		_server: 'servers',
		t: 'string',
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
		_server: 'servers',
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
		roomUpdatedAt: { type: 'date', optional: true }
	}
};

const usersSchema = {
	name: 'users',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		_server: 'servers',
		username: 'string',
		name: { type: 'string', optional: true }
	}
};

const attachment = {
	name: 'attachment',
	properties: {
		description: { type: 'string', optional: true },

		image_size: { type: 'int', optional: true },

		image_type: { type: 'string', optional: true },

		image_url: { type: 'string', optional: true },
		title: { type: 'string', optional: true },

		title_link: { type: 'string', optional: true },
		title_link_download: { type: 'bool', optional: true },
		type: { type: 'string', optional: true }
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
		_server: 'servers',
		msg: { type: 'string', optional: true },
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
		_updatedAt: { type: 'date', optional: true },
		temp: { type: 'bool', optional: true },
		pinned: { type: 'bool', optional: true },
		starred: { type: 'bool', optional: true },
		editedBy: 'messagesEditedBy'
	}
};
//
// Realm.clearTestState();
// AsyncStorage.clear();
const realm = new Realm({
	schema: [
		settingsSchema,
		serversSchema,
		subscriptionSchema,
		subscriptionRolesSchema,
		messagesSchema,
		usersSchema,
		roomsSchema,
		attachment,
		messagesEditedBySchema,
		permissionsSchema,
		permissionsRolesSchema
	],
	deleteRealmIfMigrationNeeded: true
});
export default realm;

// realm.write(() => {
// 	realm.create('servers', { id: 'https://open.rocket.chat', current: false }, true);
// 	realm.create('servers', { id: 'http://localhost:3000', current: false }, true);
// 	realm.create('servers', { id: 'http://10.0.2.2:3000', current: false }, true);
// });

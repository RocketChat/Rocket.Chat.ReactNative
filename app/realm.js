import Realm from 'realm';

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
		value: {type: 'string', optional: true}
	}
};

const subscriptionSchema = {
	name: 'subscriptions',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		t: 'string',
		ts: 'date',
		ls: 'date',
		name: 'string',
		fname: {type: 'string', optional: true},
		rid: 'string',
		// u: { _id: 'hKCY2XGzHYk89SAaM', username: 'rodrigo', name: null },
		open: 'bool',
		alert: 'bool',
		// roles: [ 'owner' ],
		unread: 'int'
		// userMentions: 0,
		// groupMentions: 0,
		// _updatedAt: Fri Jul 28 2017 18:31:35 GMT-0300 (-03),
	}
};

const usersSchema = {
	name: 'users',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		username: 'string',
		name: {type: 'string', optional: true}
	}
}

const messagesSchema = {
	name: 'messages',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		msg: {type: 'string', optional: true},
		rid: 'string',
		ts: 'date',
		u: 'users',
		// mentions: [],
		// channels: [],
		_updatedAt: 'date'
	}
};

// Realm.clearTestState();

const realm = new Realm({
	schema: [settingsSchema, serversSchema, subscriptionSchema, messagesSchema, usersSchema]
});

export default realm;

// Clear settings
realm.write(() => {
	const allSettins = realm.objects('settings');
	realm.delete(allSettins);
});


console.log(realm.objects('servers'));

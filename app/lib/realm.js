import Realm from 'realm';
import { AsyncStorage } from 'react-native';

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
		valueAsNumber: { type: 'int', optional: true }
	}
};

const subscriptionSchema = {
	name: 'subscriptions',
	primaryKey: '_id',
	properties: {
		_id: 'string',
		_server: 'servers',
		t: 'string',
		ts: { type: 'date', optional: true },
		ls: { type: 'date', optional: true },
		name: 'string',
		fname: { type: 'string', optional: true },
		rid: 'string',
		// u: { _id: 'hKCY2XGzHYk89SAaM', username: 'rodrigo', name: null },
		open: { type: 'bool', optional: true },
		alert: { type: 'bool', optional: true },
		// roles: [ 'owner' ],
		unread: { type: 'int', optional: true },
		// userMentions: 0,
		// groupMentions: 0,
		_updatedAt: { type: 'date', optional: true }
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
		temp: { type: 'bool', optional: true }
	}

	// a: {
	// 	attachments: [
	// 		{
	// 			color: 'danger',
	// 			fields: [
	// 				{
	// 					title: 'Bounce Type',
	// 					value: 'Permanent'
	// 				},
	// 				{
	// 					title: 'Bounce Sub Type',
	// 					value: 'General'
	// 				},
	// 				{
	// 					title: 'Reporting MTA',
	// 					value: 'dsn; a8-82.smtp-out.amazonses.com'
	// 				},
	// 				{
	// 					title: 'Timestamp',
	// 					value: 'Tue Apr 19 2016 14:11:08 GMT-0400 (EDT)'
	// 				}
	// 			]
	// 		},
	// 		{
	// 			fields: [
	// 				{
	// 					title: 'Email Address',
	// 					value: 'aaa@asd.at'
	// 				},
	// 				{
	// 					title: 'Status',
	// 					value: '5.1.1'
	// 				},
	// 				{
	// 					title: 'Action',
	// 					value: 'failed'
	// 				},
	// 				{
	// 					title: 'Diagnostic Code',
	// 					value: 'smtp; 550 5.1.1 <aaa@asd.at>: Recipient address rejected: User unknown in virtual mailbox table'
	// 				}
	// 			]
	// 		}
	// 	],
	// 	bot: {
	// 		i: 'EMQ3S3GGNJrrgJa4Z'
	// 	},
	// 	u: {
	// 		_id: 'rocket.cat',
	// 		username: 'rocket.cat'
	// 	},
	// 	roles: [
	// 		'bot',
	// 		null
	// 	]
	// }
};
//
// Realm.clearTestState();
// AsyncStorage.clear();
const realm = new Realm({
	schema: [settingsSchema, serversSchema, subscriptionSchema, messagesSchema, usersSchema, attachment]
});
export default realm;

// realm.write(() => {
// 	realm.create('servers', { id: 'https://demo.rocket.chat', current: false }, true);
// 	realm.create('servers', { id: 'http://localhost:3000', current: false }, true);
// 	realm.create('servers', { id: 'http://10.0.2.2:3000', current: false }, true);
// });

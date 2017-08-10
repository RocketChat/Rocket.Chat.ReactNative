import Meteor from 'react-native-meteor';
import Random from 'react-native-meteor/lib/Random';
import realm from './realm';

export { Accounts } from 'react-native-meteor';

const RocketChat = {

	createChannel({ name, users, type }) {
		return new Promise((resolve, reject) => {
			Meteor.call(type ? 'createChannel' : 'createPrivateGroup', name, users, type, (err, res) => (err ? reject(err) : resolve(res)));
		});
	},
	get currentServer() {
		const current = realm.objects('servers').filtered('current = true')[0];
		return current && current.id;
	},

	set currentServer(server) {
		realm.write(() => {
			realm.objects('servers').filtered('current = true').forEach(item => (item.current = false));
			realm.create('servers', { id: server, current: true }, true);
		});
	},

	connect(cb) {
		const url = `${ RocketChat.currentServer }/websocket`;

		Meteor.connect(url);

		Meteor.ddp.on('connected', () => {
			console.log('connected');

			Meteor.call('public-settings/get', (err, data) => {
				if (err) {
					console.error(err);
				}

				realm.write(() => {
					data.forEach((item) => {
						const setting = {
							_id: item._id
						};
						setting._server = { id: RocketChat.currentServer };
						if (typeof item.value === 'string') {
							setting.value = item.value;
						}
						realm.create('settings', setting, true);
					});
				});

				if (cb) {
					cb();
				}
			});

			Meteor.ddp.on('changed', (ddbMessage) => {
				// console.log('changed', ddbMessage);
				if (ddbMessage.collection === 'stream-room-messages') {
					realm.write(() => {
						const message = ddbMessage.fields.args[0];
						message.temp = false;
						message._server = { id: RocketChat.currentServer };
						realm.create('messages', message, true);
					});
				}

				if (ddbMessage.collection === 'stream-notify-user') {
					console.log(ddbMessage);
					realm.write(() => {
						const data = ddbMessage.fields.args[1];
						data._server = { id: RocketChat.currentServer };
						realm.create('subscriptions', data, true);
					});
				}
			});
		});
	},

	loginWithPassword(selector, password, cb) {
		Meteor.loginWithPassword(selector, password, () => cb && cb());
	},

	loadSubscriptions(cb) {
		Meteor.call('subscriptions/get', (err, data) => {
			if (err) {
				console.error(err);
			}

			realm.write(() => {
				data.forEach((subscription) => {
					// const subscription = {
					// 	_id: item._id
					// };
					// if (typeof item.value === 'string') {
					// 	subscription.value = item.value;
					// }
					subscription._server = { id: RocketChat.currentServer };
					realm.create('subscriptions', subscription, true);
				});
			});

			return cb && cb();
		});
	},

	loadMessagesForRoom(rid, cb) {
		Meteor.call('loadHistory', rid, null, 50, (err, data) => {
			if (err) {
				console.error(err);
			}

			realm.write(() => {
				data.messages.forEach((message) => {
					message.temp = false;
					message._server = { id: RocketChat.currentServer };
					realm.create('messages', message, true);
				});
			});

			if (cb) {
				cb();
			}
		});

		Meteor.subscribe('stream-room-messages', rid, false);
	},

	sendMessage(rid, msg) {
		const _id = Random.id();
		const user = Meteor.user();

		realm.write(() => {
			realm.create('messages', {
				_id,
				rid,
				msg,
				ts: new Date(),
				_updatedAt: new Date(),
				temp: true,
				_server: { id: RocketChat.currentServer },
				u: {
					_id: user._id,
					username: user.username
				}
			}, true);
		});

		return new Promise((resolve, reject) => {
			Meteor.call('sendMessage', { _id, rid, msg }, (error, result) => {
				if (error) {
					return reject(error);
				}
				return resolve(result);
			});
		});
	},

	spotlight(search, usernames) {
		return new Promise((resolve, reject) => {
			Meteor.call('spotlight', search, usernames, (error, result) => {
				if (error) {
					return reject(error);
				}
				return resolve(result);
			});
		});
	},

	createDirectMessage(username) {
		return new Promise((resolve, reject) => {
			Meteor.call('createDirectMessage', username, (error, result) => {
				if (error) {
					return reject(error);
				}
				return resolve(result);
			});
		});
	},

	joinRoom(rid) {
		return new Promise((resolve, reject) => {
			Meteor.call('joinRoom', rid, (error, result) => {
				if (error) {
					return reject(error);
				}
				return resolve(result);
			});
		});
	},


	/*
		"name":"yXfExLErmNR5eNPx7.png"
		"size":961
		"type":"image/png"
		"rid":"GENERAL"
		"description":""
		"store":"fileSystem"
	*/
	ufsCreate(fileInfo) {
		return new Promise((resolve, reject) => {
			Meteor.call('ufsCreate', fileInfo, (error, result) => {
				if (error) {
					return reject(error);
				}
				return resolve(result);
			});
		});
	},

	// ["ZTE8CKHJt7LATv7Me","fileSystem","e8E96b2819"
	ufsComplete(fileId, store, token) {
		return new Promise((resolve, reject) => {
			Meteor.call('ufsComplete', fileId, store, token, (error, result) => {
				if (error) {
					return reject(error);
				}
				return resolve(result);
			});
		});
	},

	/*
		- "GENERAL"
		- {
			"type":"image/png",
			"size":961,
			"name":"yXfExLErmNR5eNPx7.png",
			"description":"",
			"url":"/ufs/fileSystem/ZTE8CKHJt7LATv7Me/yXfExLErmNR5eNPx7.png"
		}
	*/
	sendFileMessage(rid, message) {
		return new Promise((resolve, reject) => {
			Meteor.call('sendFileMessage', rid, null, message, (error, result) => {
				if (error) {
					return reject(error);
				}
				return resolve(result);
			});
		});
	}
};

export default RocketChat;

Meteor.Accounts.onLogin(() => {
	Meteor.call('subscriptions/get', (err, data) => {
		if (err) {
			console.error(err);
		}

		realm.write(() => {
			data.forEach((subscription) => {
				// const subscription = {
				// 	_id: item._id
				// };
				// if (typeof item.value === 'string') {
				// 	subscription.value = item.value;
				// }
				subscription._server = { id: RocketChat.currentServer };
				realm.create('subscriptions', subscription, true);
			});
		});
		Meteor.subscribe('stream-notify-user', `${ Meteor.userId() }/subscriptions-changed`, false);
	});
});

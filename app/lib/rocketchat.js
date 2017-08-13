import Meteor from 'react-native-meteor';
import Random from 'react-native-meteor/lib/Random';
import { AsyncStorage } from 'react-native';
import { hashPassword } from 'react-native-meteor/lib/utils';

import reduxStore from '../lib/createStore';
import settingsType from '../constants/settings';
import realm from './realm';
import debounce from '../utils/debounce';
import * as actions from '../actions';

export { Accounts } from 'react-native-meteor';

const call = (method, ...params) => new Promise((resolve, reject) => {
	Meteor.call(method, ...params, (err, data) => {
		if (err) {
			reject(err);
		}
		resolve(data);
	});
});

const write = (() => {
	const cache = [];
	const run = debounce(() => {
		if (!cache.length) {
			return;
		}
		realm.write(() => {
			cache.forEach(([name, obj]) => {
				realm.create(name, obj, true);
			});
		});
		// cache = [];
	}, 1000);
	return (name, obj) => {
		cache.push([name, obj]);
		run();
	};
})();

const RocketChat = {
	createChannel({ name, users, type }) {
		return new Promise((resolve, reject) => {
			Meteor.call(type ? 'createChannel' : 'createPrivateGroup', name, users, type, (err, res) => (err ? reject(err) : resolve(res)));
		});
	},

	get currentServer() {
		const current = realm.objects('servers').filtered('current = true').slice(0, 1)[0];
		return current && current.id;
	},

	set currentServer(server) {
		realm.write(() => {
			realm.objects('servers').filtered('current = true').forEach(item => (item.current = false));
			realm.create('servers', { id: server, current: true }, true);
		});
	},

	async getUserToken() {
		const TOKEN_KEY = 'reactnativemeteor_usertoken';
		try {
			return await AsyncStorage.getItem(TOKEN_KEY);
		} catch (error) {
			console.warn(`AsyncStorage error: ${ error.message }`);
		}
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

				const settings = {};
				realm.write(() => {
					data.forEach((item) => {
						const setting = {
							_id: item._id
						};
						setting._server = { id: RocketChat.currentServer };
						if (settingsType[item.type]) {
							setting[settingsType[item.type]] = item.value;
							realm.create('settings', setting, true);
						}

						settings[item._id] = item.value;
					});
				});
				reduxStore.dispatch(actions.setAllSettings(settings));

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
						// write('messages', message);
						realm.create('messages', message, true);
					});
				}

				this.subCache = this.subCache || {};
				this.roomCache = this.roomCache || {};
				this.cache = {};
				if (ddbMessage.collection === 'stream-notify-user') {
					const data = ddbMessage.fields.args[1];
					let key;
					if (ddbMessage.fields.eventName && ddbMessage.fields.eventName.indexOf('rooms-changed') > -1) {
						this.roomCache[data._id] = data;
						key = data._id;
					} else {
						this.subCache[data.rid] = data;
						key = data.rid;
						delete this.subCache[key]._updatedAt;
					}
					this.cache[key] = this.cache[key] ||
					setTimeout(() => {
						this.subCache[key] = this.subCache[key] || realm.objects('subscriptions').filtered('rid = $0', key).slice(0, 1)[0];
						if (this.roomCache[key]) {
							this.subCache[key]._updatedAt = this.roomCache[key]._updatedAt;
						}

						write('subscriptions', this.subCache[key]);
						delete this.subCache[key];
						delete this.roomCache[key];
						delete this.cache[key];
					}, 550);
				}
			});
		});
	},

	login(params, callback) {
		Meteor._startLoggingIn();
		Meteor.call('login', params, (err, result) => {
			Meteor._endLoggingIn();

			Meteor._handleLoginCallback(err, result);

			if (typeof callback === 'function') {
				callback(err);
			}
		});
	},

	loginWithPassword(username, password, callback) {
		let params = {};
		const state = reduxStore.getState();

		if (state.settings.LDAP_Enable) {
			params = {
				ldap: true,
				username,
				ldapPass: password,
				ldapOptions: {}
			};
		} else if (state.settings.CROWD_Enable) {
			params = {
				crowd: true,
				username,
				crowdPassword: password
			};
		} else {
			params = {
				password: hashPassword(password),
				user: {
					username
				}
			};

			if (typeof username === 'string') {
				if (username.indexOf('@') !== -1) {
					params.user = { email: username };
				}
			}
		}

		console.log({ params });
		this.login(params, callback);
	},

	loadSubscriptions(cb) {
		Meteor.call('subscriptions/get', (err, data) => {
			if (err) {
				console.error(err);
			}
			if (data.length) {
				realm.write(() => {
					data.forEach((subscription) => {
						// const subscription = {
						// 	_id: item._id
						// };
						// if (typeof item.value === 'string') {
						// 	subscription.value = item.value;
						// }
						subscription._server = { id: RocketChat.currentServer };
						write('subscriptions', subscription);
						realm.create('subscriptions', subscription, true);
					});
				});
			}

			return cb && cb();
		});
	},

	loadMessagesForRoom(rid, end, cb) {
		Meteor.call('loadHistory', rid, end, 20, (err, data) => {
			if (err) {
				console.error(err);
				if (cb) {
					cb({ end: true });
				}
				return;
			}
			if (data.messages.length) {
				realm.write(() => {
					data.messages.forEach((message) => {
						message.temp = false;
						message._server = { id: RocketChat.currentServer };
						// write('messages', message);
						realm.create('messages', message, true);
					});
				});
			}

			if (cb) {
				if (data.messages.length < 20) {
					cb({ end: true });
				} else {
					cb({ end: false });
				}
			}
		});

		Meteor.subscribe('stream-room-messages', rid, false);
	},

	sendMessage(rid, msg) {
		const _id = Random.id();
		const user = Meteor.user();

		realm.write(() => {
		// write('messages', {
		// 	_id,
		// 	rid,
		// 	msg,
		// 	ts: new Date(),
		// 	_updatedAt: new Date(),
		// 	temp: true,
		// 	_server: { id: RocketChat.currentServer },
		// 	u: {
		// 		_id: user._id,
		// 		username: user.username
		// 	}
		// });
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
	readMessages(rid) {
		return call('readMessages', rid);
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

if (RocketChat.currentServer) {
	reduxStore.dispatch(actions.setCurrentServer(RocketChat.currentServer));
}

Meteor.Accounts.onLogin(() => {
	Promise.all([call('subscriptions/get'), call('rooms/get')]).then(([subscriptions, rooms]) => {
		subscriptions = subscriptions.sort((s1, s2) => (s1.rid > s2.rid ? 1 : -1));
		rooms = rooms.sort((s1, s2) => (s1._id > s2._id ? 1 : -1));
		const data = subscriptions.map((subscription, index) => {
			subscription._updatedAt = rooms[index]._updatedAt;
			return subscription;
		});
		Meteor.subscribe('stream-notify-user', `${ Meteor.userId() }/subscriptions-changed`, false);
		Meteor.subscribe('stream-notify-user', `${ Meteor.userId() }/rooms-changed`, false);
		realm.write(() => {
			data.forEach((subscription) => {
			// const subscription = {
			// 	_id: item._id
			// };
			// if (typeof item.value === 'string') {
			// 	subscription.value = item.value;
			// }
				subscription._server = { id: RocketChat.currentServer };
				// write('subscriptions', subscription);
				realm.create('subscriptions', subscription, true);
			});
		});
	}).then(() => {
		console.log('subscriptions done.');
	});
});

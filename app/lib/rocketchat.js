import Meteor from 'react-native-meteor';
import Random from 'react-native-meteor/lib/Random';
import { AsyncStorage } from 'react-native';
import { hashPassword } from 'react-native-meteor/lib/utils';

import RNFetchBlob from 'react-native-fetch-blob';
import reduxStore from '../lib/createStore';
import settingsType from '../constants/settings';
import realm from './realm';
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

				if (typeof cb === 'function') {
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

				if (ddbMessage.collection === 'stream-notify-user') {
					// console.log(ddbMessage);
					realm.write(() => {
						const data = ddbMessage.fields.args[1];
						data._server = { id: RocketChat.currentServer };
						realm.create('subscriptions', data, true);
					});
				}
			});
		});
	},

	async login(params, callback) {
		await new Promise((resolve, reject) => {
			Meteor._startLoggingIn();
			console.log('meteor login', params);
			return Meteor.call('login', params, (err, result) => {
				Meteor._endLoggingIn();
				Meteor._handleLoginCallback(err, result);
				err ? reject(err) : resolve(result);
				if (typeof callback === 'function') {
					callback(err, result);
				}
			});
		});
	},

	loginWithPassword({ username, password, code }, callback) {
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

			if (typeof username === 'string' && username.indexOf('@') !== -1) {
				params.user = { email: username };
			}
		}

		if (code) {
			params = {
				totp: {
					login: params,
					code
				}
			};
		}

		return this.login(params, callback);
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
						// write('subscriptions', subscription);
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

	getMessage(rid, msg = {}) {
		const _id = Random.id();
		const user = Meteor.user();
		const message = {
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
		};

		realm.write(() => {
			realm.create('messages', message, true);
			// write('messages', message, true);
		});
		return message;
	},
	sendMessage(rid, msg) {
		const tempMessage = this.getMessage(rid, msg);
		return call('sendMessage', { _id: tempMessage._id, rid, msg });
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
	_ufsCreate(fileInfo) {
		// return call('ufsCreate', fileInfo);
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
	_ufsComplete(fileId, store, token) {
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
	_sendFileMessage(rid, data, msg = {}) {
		return new Promise((resolve, reject) => {
			Meteor.call('sendFileMessage', rid, null, data, msg, (error, result) => {
				if (error) {
					return reject(error);
				}
				return resolve(result);
			});
		});
	},
	async sendFileMessage(rid, fileInfo, data) {
		const placeholder = RocketChat.getMessage(rid, 'Sending an image');
		try {
			const result = await RocketChat._ufsCreate({ ...fileInfo, rid });

			await RNFetchBlob.fetch('POST', result.url, {
				'Content-Type': 'application/octet-stream'
			}, data);

			const completeRresult = await RocketChat._ufsComplete(result.fileId, fileInfo.store, result.token);

			return await RocketChat._sendFileMessage(completeRresult.rid, {
				_id: completeRresult._id,
				type: completeRresult.type,
				size: completeRresult.size,
				name: completeRresult.name,
				url: completeRresult.path
			});
		} catch (e) {
			return e;
		} finally {
			realm.write(() => {
				const msg = realm.objects('messages').filtered('_id = $0', placeholder._id);
				realm.delete(msg);
			});
		}
	},

	logout() {
		return AsyncStorage.clear();
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
		// Meteor.subscribe('stream-notify-user', `${ Meteor.userId() }/rooms-changed`, false);
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

// Use for logout
// AsyncStorage.clear();

import Meteor from 'react-native-meteor';
import Random from 'react-native-meteor/lib/Random';
import { AsyncStorage } from 'react-native';
import { hashPassword } from 'react-native-meteor/lib/utils';

import RNFetchBlob from 'react-native-fetch-blob';
import reduxStore from './createStore';
import settingsType from '../constants/settings';
import realm from './realm';
import * as actions from '../actions';
import { disconnect, connectSuccess } from '../actions/connect';

export { Accounts } from 'react-native-meteor';

const call = (method, ...params) => new Promise((resolve, reject) => {
	Meteor.call(method, ...params, (err, data) => {
		if (err) {
			reject(err);
		}
		resolve(data);
	});
});
const TOKEN_KEY = 'reactnativemeteor_usertoken';

const RocketChat = {
	TOKEN_KEY,

	createChannel({ name, users, type }) {
		return new Promise((resolve, reject) => {
			Meteor.call(type ? 'createChannel' : 'createPrivateGroup', name, users, type, (err, res) => (err ? reject(err) : resolve(res)));
		});
	},

	async getUserToken() {
		try {
			return await AsyncStorage.getItem(TOKEN_KEY);
		} catch (error) {
			console.warn(`AsyncStorage error: ${ error.message }`);
		}
	},
	async testServer(url) {
		if (/^(https?:\/\/)?(((\w|[0-9])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(url)) {
			const response = await fetch(url, { method: 'HEAD' });
			if (response.status === 200 && response.headers.get('x-instance-id') != null && response.headers.get('x-instance-id').length) {
				return url;
			}
		}
		throw new Error({ error: 'invalid server' });
	},
	connect(_url) {
		return new Promise((resolve) => {
			const url = `${ _url }/websocket`;

			Meteor.connect(url, { autoConnect: true, autoReconnect: true });
			Meteor.ddp.on('disconnected', () => {
				reduxStore.dispatch(disconnect());
			});
			Meteor.ddp.on('connected', () => {
				reduxStore.dispatch(connectSuccess());
				resolve();
			});
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
							setting._server = { id: reduxStore.getState().server.server };
							if (settingsType[item.type]) {
								setting[settingsType[item.type]] = item.value;
								realm.create('settings', setting, true);
							}

							settings[item._id] = item.value;
						});
					});
					reduxStore.dispatch(actions.setAllSettings(settings));
				});

				Meteor.ddp.on('changed', (ddbMessage) => {
					if (ddbMessage.collection === 'stream-room-messages') {
						realm.write(() => {
							const message = ddbMessage.fields.args[0];
							message.temp = false;
							message._server = { id: reduxStore.getState().server.server };
							realm.create('messages', message, true);
						});
					}

					if (ddbMessage.collection === 'stream-notify-user') {
						realm.write(() => {
							const data = ddbMessage.fields.args[1];
							data._server = { id: reduxStore.getState().server.server };
							realm.create('subscriptions', data, true);
						});
					}
				});
			});
		})
			.catch(e => console.error(e));
	},

	login(params, callback) {
		return new Promise((resolve, reject) => {
			Meteor._startLoggingIn();
			return Meteor.call('login', params, (err, result) => {
				Meteor._endLoggingIn();
				Meteor._handleLoginCallback(err, result);
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
				if (typeof callback === 'function') {
					callback(err, result);
				}
			});
		});
	},

	me({ server, token, userId }) {
		return fetch(`${ server }/api/v1/me`, {
			method: 'get',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token': token,
				'X-User-Id': userId
			}
		}).then(response => response.json());
	},

	register({ credentials }) {
		return new Promise((resolve, reject) => {
			Meteor.call('registerUser', credentials, (err, userId) => {
				if (err) {
					reject(err);
				}
				resolve(userId);
			});
		});
	},

	setUsername({ credentials }) {
		return new Promise((resolve, reject) => {
			Meteor.call('setUsername', credentials.username, (err, result) => {
				if (err) {
					reject(err);
				}
				resolve(result);
			});
		});
	},

	forgotPassword(email) {
		return new Promise((resolve, reject) => {
			Meteor.call('sendForgotPasswordEmail', email, (err, result) => {
				if (err) {
					reject(err);
				}
				resolve(result);
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

	// loadRooms(cb) {
	// 	console.warn('a');
	// 	Meteor.call('rooms/get', (err, data) => {
	// 		if (err) {
	// 			console.error(err);
	// 		}
	// 		console.warn(`rooms ${ data.length }`);
	// 		if (data.length) {
	// 			realm.write(() => {
	// 				data.forEach((room) => {
	// 					room._server = { id: reduxStore.getState().server.server };
	// 					realm.create('rooms', room, true);
	// 				});
	// 			});
	// 		}

	// 		return cb && cb();
	// 	});
	// },

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
						subscription._server = { id: reduxStore.getState().server.server };
						// write('subscriptions', subscription);
						realm.create('subscriptions', subscription, true);
					});
				});
			}

			return cb && cb();
		});
	},

	loadMessagesForRoom(rid, end, cb) {
		return new Promise((resolve, reject) => {
			Meteor.call('loadHistory', rid, end, 20, (err, data) => {
				if (err) {
					if (cb) {
						cb({ end: true });
					}
					return reject(err);
				}
				if (data && data.messages.length) {
					realm.write(() => {
						data.messages.forEach((message) => {
							message.temp = false;
							message._server = { id: reduxStore.getState().server.server };
							// write('messages', message);
							realm.create('messages', message, true);
						});
					});
				}

				if (cb) {
					if (data && data.messages.length < 20) {
						cb({ end: true });
					} else {
						cb({ end: false });
					}
				}
				resolve();
				Meteor.subscribe('stream-room-messages', rid, false);
			});
		});
	},

	getMessage(rid, msg = {}) {
		const _id = Random.id();
		// console.log('reduxStore.getState().login.id ', reduxStore.getState().login);
		const message = {
			_id,
			rid,
			msg,
			ts: new Date(),
			_updatedAt: new Date(),
			temp: true,
			_server: { id: reduxStore.getState().server.server },
			u: {
				_id: reduxStore.getState().login.user.id || '1',
				username: reduxStore.getState().login.user.username
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
	getRooms() {
		return Promise.all([call('subscriptions/get'), call('rooms/get')]).then(([subscriptions, rooms]) => {
			const { server, login } = reduxStore.getState();
			const data = subscriptions.map((subscription) => {
				subscription._updatedAt = (rooms.find(room => room._id === subscription.rid) || {})._updatedAt;
				subscription._server = { id: server.server };
				return subscription;
			});

			realm.write(() => {
				data.forEach((subscription) => {
					realm.create('subscriptions', subscription, true);
				});
			});
			Meteor.subscribe('stream-notify-user', `${ login.user.id }/subscriptions-changed`, false);
			return data;
		});
	},
	logout({ server }) {
		Meteor.logout();
		Meteor.disconnect();
		AsyncStorage.removeItem(TOKEN_KEY);
		AsyncStorage.removeItem(`${ TOKEN_KEY }-${ server }`);
	}
};

export default RocketChat;

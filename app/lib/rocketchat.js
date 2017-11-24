import Meteor from 'react-native-meteor';
import Random from 'react-native-meteor/lib/Random';
import { AsyncStorage, Platform } from 'react-native';
import { hashPassword } from 'react-native-meteor/lib/utils';

import RNFetchBlob from 'react-native-fetch-blob';
import reduxStore from './createStore';
import settingsType from '../constants/settings';
import realm from './realm';
import * as actions from '../actions';
import { someoneTyping } from '../actions/room';
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
		return call(type ? 'createChannel' : 'createPrivateGroup', name, users, type);
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

			Meteor.ddp.on('connected', async() => {
				Meteor.ddp.on('changed', (ddpMessage) => {
					const server = { id: reduxStore.getState().server.server };
					if (ddpMessage.collection === 'stream-room-messages') {
						return realm.write(() => {
							const message = ddpMessage.fields.args[0];
							message.temp = false;
							message._server = server;
							message.attachments = message.attachments || [];
							message.starred = message.starred && message.starred.length > 0;
							realm.create('messages', message, true);
						});
					}
					if (ddpMessage.collection === 'stream-notify-room') {
						const [_rid, ev] = ddpMessage.fields.eventName.split('/');
						if (ev !== 'typing') {
							return;
						}
						return reduxStore.dispatch(someoneTyping({ _rid, username: ddpMessage.fields.args[0], typing: ddpMessage.fields.args[1] }));
					}
					if (ddpMessage.collection === 'stream-notify-user') {
						const [type, data] = ddpMessage.fields.args;
						const [, ev] = ddpMessage.fields.eventName.split('/');
						if (/subscriptions/.test(ev)) {
							if (data.roles) {
								data.roles = data.roles.map(role => ({ value: role }));
							}
							realm.write(() => {
								realm.create('subscriptions', data, true);
							});
						}
						if (/rooms/.test(ev) && type === 'updated') {
							const sub = realm.objects('subscriptions').filtered('rid == $0', data._id)[0];
							realm.write(() => {
								sub.roomUpdatedAt = data._updatedAt;
							});
						}
					}
				});
				RocketChat.getSettings();
				RocketChat.getPermissions();
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
					if (/user not found/i.test(err.reason)) {
						err.error = 1;
						err.reason = 'User or Password incorrect';
						err.message = 'User or Password incorrect';
					}
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

	userInfo({ server, token, userId }) {
		return fetch(`${ server }/api/v1/users.info?userId=${ userId }`, {
			method: 'get',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token': token,
				'X-User-Id': userId
			}
		}).then(response => response.json());
	},

	register({ credentials }) {
		return call('registerUser', credentials);
	},

	setUsername({ credentials }) {
		return call('setUsername', credentials.username);
	},

	forgotPassword(email) {
		return call('sendForgotPasswordEmail', email);
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
		const { server } = reduxStore.getState().server;
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
						subscription._server = { id: server };
						// write('subscriptions', subscription);
						realm.create('subscriptions', subscription, true);
					});
				});
			}

			return cb && cb();
		});
	},
	registerPushToken(id, token) {
		const key = Platform.OS === 'ios' ? 'apn' : 'gcm';
		const data = {
			id: `RocketChatRN${ id }`,
			token: { [key]: token },
			appName: 'chat.rocket.reactnative', // TODO: try to get from config file
			userId: id,
			metadata: {}
		};
		return call('raix:push-update', data);
	},

	updatePushToken(pushId) {
		return call('raix:push-setuser', pushId);
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
							message.attachments = message.attachments || [];
							// write('messages', message);
							message.starred = !!message.starred;
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
		return call('spotlight', search, usernames);
	},

	createDirectMessage(username) {
		return call('createDirectMessage', username);
	},
	readMessages(rid) {
		return call('readMessages', rid);
	},
	joinRoom(rid) {
		return call('joinRoom', rid);
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
		return call('ufsCreate', fileInfo);
	},

	// ["ZTE8CKHJt7LATv7Me","fileSystem","e8E96b2819"
	_ufsComplete(fileId, store, token) {
		return call('ufsComplete', fileId, store, token);
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
		return call('sendFileMessage', rid, null, data, msg);
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
	async getRooms() {
		const { server, login } = reduxStore.getState();
		let lastMessage = realm
			.objects('subscriptions')
			.filtered('_server.id = $0', server.server)
			.sorted('roomUpdatedAt', true)[0];
		lastMessage = lastMessage && new Date(lastMessage.roomUpdatedAt);
		let [subscriptions, rooms] = await Promise.all([call('subscriptions/get', lastMessage), call('rooms/get', lastMessage)]);

		if (lastMessage) {
			subscriptions = subscriptions.update;
			rooms = rooms.update;
		}

		const data = subscriptions.map((subscription) => {
			const room = rooms.find(({ _id }) => _id === subscription.rid);
			if (room) {
				subscription.roomUpdatedAt = room._updatedAt;
			}
			if (subscription.roles) {
				subscription.roles = subscription.roles.map(role => ({ value: role }));
			}
			subscription._server = { id: server.server };
			return subscription;
		});
		realm.write(() => {
			data.forEach(subscription =>
				realm.create('subscriptions', subscription, true));
		});
		Meteor.subscribe('stream-notify-user', `${ login.user.id }/subscriptions-changed`, false);
		Meteor.subscribe('stream-notify-user', `${ login.user.id }/rooms-changed`, false);
		return data;
	},
	logout({ server }) {
		Meteor.logout();
		Meteor.disconnect();
		AsyncStorage.removeItem(TOKEN_KEY);
		AsyncStorage.removeItem(`${ TOKEN_KEY }-${ server }`);
	},
	async getSettings() {
		const temp = realm.objects('settings').sorted('_updatedAt', true)[0];
		const result = await (!temp ? call('public-settings/get') : call('public-settings/get', new Date(temp._updatedAt)));
		const settings = temp ? result.update : result;
		const filteredSettings = RocketChat._prepareSettings(RocketChat._filterSettings(settings));
		realm.write(() => {
			filteredSettings.forEach(setting => realm.create('settings', setting, true));
		});
		reduxStore.dispatch(actions.setAllSettings(RocketChat.parseSettings(filteredSettings)));
	},
	parseSettings: settings => settings.reduce((ret, item) => {
		ret[item._id] = item[settingsType[item.type]] || item.valueAsString || item.valueAsNumber ||
			item.valueAsBoolean || item.value;
		return ret;
	}, {}),
	_prepareSettings(settings) {
		return settings.map((setting) => {
			setting[settingsType[setting.type]] = setting.value;
			return setting;
		});
	},
	_filterSettings: settings => settings.filter(setting => settingsType[setting.type] && setting.value),
	async getPermissions() {
		const temp = realm.objects('permissions').sorted('_updatedAt', true)[0];
		const result = await (!temp ? call('permissions/get') : call('permissions/get', new Date(temp._updatedAt)));
		let permissions = temp ? result.update : result;
		permissions = RocketChat._preparePermissions(permissions);
		realm.write(() => {
			permissions.forEach(permission => realm.create('permissions', permission, true));
		});
		reduxStore.dispatch(actions.setAllPermissions(RocketChat.parsePermissions(permissions)));
	},
	parsePermissions: permissions => permissions.reduce((ret, item) => {
		ret[item._id] = item.roles.reduce((roleRet, role) => [...roleRet, role.value], []);
		return ret;
	}, {}),
	_preparePermissions(permissions) {
		permissions.forEach((permission) => {
			permission.roles = permission.roles.map(role => ({ value: role }));
		});
		return permissions;
	},
	deleteMessage(message) {
		return call('deleteMessage', { _id: message._id });
	},
	editMessage(message) {
		const { _id, msg, rid } = message;
		return call('updateMessage', { _id, msg, rid });
	},
	toggleStarMessage(message) {
		return call('starMessage', { _id: message._id, rid: message.rid, starred: !message.starred });
	},
	togglePinMessage(message) {
		if (message.pinned) {
			return call('unpinMessage', message);
		}
		return call('pinMessage', message);
	},
	getRoom(rid) {
		const result = realm.objects('subscriptions').filtered('rid = $0', rid);
		if (result.length === 0) {
			return Promise.reject(new Error('Room not found'));
		}
		return Promise.resolve(result[0]);
	},
	async getPermalink(message) {
		const room = await RocketChat.getRoom(message.rid);
		const roomType = {
			p: 'group',
			c: 'channel',
			d: 'direct'
		}[room.t];
		return `${ room._server.id }/${ roomType }/${ room.name }?msg=${ message._id }`;
	},
	subscribe(...args) {
		return Meteor.subscribe(...args);
	},
	emitTyping(room, t = true) {
		const { login } = reduxStore.getState();
		return call('stream-notify-room', `${ room }/typing`, login.user.username, t);
	}
};

export default RocketChat;

import Random from 'react-native-meteor/lib/Random';
import { AsyncStorage, Platform } from 'react-native';
import { hashPassword } from 'react-native-meteor/lib/utils';
import _ from 'lodash';

import RNFetchBlob from 'react-native-fetch-blob';
import reduxStore from './createStore';
import settingsType from '../constants/settings';
import messagesStatus from '../constants/messagesStatus';
import database from './realm';
import * as actions from '../actions';
import { someoneTyping, roomMessageReceived } from '../actions/room';
import { setUser } from '../actions/login';
import { disconnect, disconnect_by_user, connectSuccess, connectFailure } from '../actions/connect';
import { requestActiveUser } from '../actions/activeUsers';
import Ddp from './ddp';

export { Accounts } from 'react-native-meteor';

const call = (method, ...params) => RocketChat.ddp.call(method, ...params); // eslint-disable-line
const TOKEN_KEY = 'reactnativemeteor_usertoken';
const SERVER_TIMEOUT = 30000;

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
		if (/^(https?:\/\/)?(((\w|[0-9-_])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(url)) {
			const response = await fetch(url, { method: 'HEAD' });
			if (response.status === 200 && response.headers.get('x-instance-id') != null && response.headers.get('x-instance-id').length) {
				return url;
			}
		}
		throw new Error({ error: 'invalid server' });
	},
	_setUser(ddpMessage) {
		let status;
		if (!ddpMessage.fields) {
			status = 'offline';
		} else {
			status = ddpMessage.fields.status || 'offline';
		}

		const { user } = reduxStore.getState().login;
		if (user && user.id === ddpMessage.id) {
			return reduxStore.dispatch(setUser({ status }));
		}

		const activeUser = {};
		activeUser[ddpMessage.id] = status;
		return reduxStore.dispatch(requestActiveUser(activeUser));
	},
	reconnect() {
		if (this.ddp) {
			this.ddp.reconnect();
		}
	},
	connect(url) {
		if (this.ddp) {
			this.ddp.disconnect();
		}
		this.ddp = new Ddp(url);
		return new Promise((resolve) => {
			this.ddp.on('disconnected_by_user', () => {
				reduxStore.dispatch(disconnect_by_user());
			});
			this.ddp.on('disconnected', () => {
				reduxStore.dispatch(disconnect());
			});
			this.ddp.on('open', async() => {
				resolve(reduxStore.dispatch(connectSuccess()));
			});
			this.ddp.on('connected', () => {
				RocketChat.getSettings();
				RocketChat.getPermissions();
				RocketChat.getCustomEmoji();
			});

			this.ddp.on('error', (err) => {
				alert(JSON.stringify(err));
				reduxStore.dispatch(connectFailure());
			});

			this.ddp.on('connected', () => this.ddp.subscribe('activeUsers', null, false));

			this.ddp.on('users', (ddpMessage) => {
				if (ddpMessage.collection === 'users') {
					return RocketChat._setUser(ddpMessage);
				}
			});

			this.ddp.on('stream-room-messages', (ddpMessage) => {
				const message = this._buildMessage(ddpMessage.fields.args[0]);
				return reduxStore.dispatch(roomMessageReceived(message));
			});

			this.ddp.on('stream-notify-room', (ddpMessage) => {
				const [_rid, ev] = ddpMessage.fields.eventName.split('/');
				if (ev !== 'typing') {
					return;
				}
				return reduxStore.dispatch(someoneTyping({ _rid, username: ddpMessage.fields.args[0], typing: ddpMessage.fields.args[1] }));
			});

			this.ddp.on('stream-notify-user', (ddpMessage) => {
				const [type, data] = ddpMessage.fields.args;
				const [, ev] = ddpMessage.fields.eventName.split('/');
				if (/subscriptions/.test(ev)) {
					if (data.roles) {
						data.roles = data.roles.map(role => ({ value: role }));
					}
					database.write(() => {
						database.create('subscriptions', data, true);
					});
				}
				if (/rooms/.test(ev) && type === 'updated') {
					const sub = database.objects('subscriptions').filtered('rid == $0', data._id)[0];
					database.write(() => {
						sub.roomUpdatedAt = data._updatedAt;
						sub.lastMessage = data.lastMessage;
						sub.ro = data.ro;
					});
				}
			});
		}).catch(console.log);
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
		this.ddp.call('subscriptions/get').then((data) => {
			if (data.length) {
				database.write(() => {
					data.forEach((subscription) => {
						database.create('subscriptions', subscription, true);
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

	_parseUrls(urls) {
		return urls.filter(url => url.meta && !url.ignoreParse).map((url, index) => {
			const tmp = {};
			const { meta } = url;
			tmp._id = index;
			tmp.title = meta.ogTitle || meta.twitterTitle || meta.title || meta.pageTitle || meta.oembedTitle;
			tmp.description = meta.ogDescription || meta.twitterDescription || meta.description || meta.oembedAuthorName;
			let decodedOgImage;
			if (meta.ogImage) {
				decodedOgImage = meta.ogImage.replace(/&amp;/g, '&');
			}
			tmp.image = decodedOgImage || meta.twitterImage || meta.oembedThumbnailUrl;
			tmp.url = url.url;
			return tmp;
		});
	},
	_buildMessage(message) {
		message.status = messagesStatus.SENT;
		message.attachments = message.attachments || [];
		if (message.urls) {
			message.urls = RocketChat._parseUrls(message.urls);
		}
		// loadHistory returns message.starred as object
		// stream-room-messages returns message.starred as an array
		message.starred = message.starred && (Array.isArray(message.starred) ? message.starred.length > 0 : !!message.starred);
		message.reactions = _.map(message.reactions, (value, key) =>
			({ emoji: key, usernames: value.usernames.map(username => ({ value: username })) }));
		return message;
	},
	loadMessagesForRoom(rid, end, cb) {
		return this.ddp.call('loadHistory', rid, end, 20).then((data) => {
			if (data && data.messages.length) {
				const messages = data.messages.map(message => this._buildMessage(message));
				database.write(() => {
					messages.forEach((message) => {
						database.create('messages', message, true);
					});
				});
			}
			if (cb) {
				cb({ end: data && data.messages.length < 20 });
			}
			return data.message;
		}, (err) => {
			if (err) {
				if (cb) {
					cb({ end: true });
				}
				return Promise.reject(err);
			}
		});
	},

	getMessage(rid, msg = {}) {
		const _id = Random.id();
		const message = {
			_id,
			rid,
			msg,
			ts: new Date(),
			_updatedAt: new Date(),
			status: messagesStatus.TEMP,
			u: {
				_id: reduxStore.getState().login.user.id || '1',
				username: reduxStore.getState().login.user.username
			}
		};

		database.write(() => {
			database.create('messages', message, true);
		});
		return message;
	},
	async _sendMessageCall(message) {
		const { _id, rid, msg } = message;
		const sendMessageCall = call('sendMessage', { _id, rid, msg });
		const timeoutCall = new Promise(resolve => setTimeout(resolve, SERVER_TIMEOUT, 'timeout'));
		const result = await Promise.race([sendMessageCall, timeoutCall]);
		if (result === 'timeout') {
			database.write(() => {
				message.status = messagesStatus.ERROR;
				database.create('messages', message, true);
			});
		}
	},
	async sendMessage(rid, msg) {
		const tempMessage = this.getMessage(rid, msg);
		return RocketChat._sendMessageCall(tempMessage);
	},
	async resendMessage(messageId) {
		const message = await database.objects('messages').filtered('_id = $0', messageId)[0];
		database.write(() => {
			message.status = messagesStatus.TEMP;
			database.create('messages', message, true);
		});
		return RocketChat._sendMessageCall(message);
	},

	spotlight(search, usernames, type) {
		return call('spotlight', search, usernames, type);
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
			database.write(() => {
				const msg = database.objects('messages').filtered('_id = $0', placeholder._id);
				database.delete(msg);
			});
		}
	},
	async getRooms() {
		const { login } = reduxStore.getState();
		let lastMessage = database
			.objects('subscriptions')
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
				subscription.lastMessage = room.lastMessage;
				subscription.ro = room.ro;
			}
			if (subscription.roles) {
				subscription.roles = subscription.roles.map(role => ({ value: role }));
			}
			return subscription;
		});


		database.write(() => {
			data.forEach(subscription => database.create('subscriptions', subscription, true));
			// rooms.forEach(room =>	database.create('rooms', room, true));
		});


		this.ddp.subscribe('stream-notify-user', `${ login.user.id }/subscriptions-changed`, false);
		this.ddp.subscribe('stream-notify-user', `${ login.user.id }/rooms-changed`, false);
		return data;
	},
	disconnect() {
		if (!this.ddp) {
			return;
		}
		reduxStore.dispatch(disconnect_by_user());
		delete this.ddp;
		return this.ddp.disconnect();
	},
	login(params, callback) {
		return this.ddp.call('login', params).then((result) => {
			if (typeof callback === 'function') {
				callback(null, result);
			}
			return result;
		}, (err) => {
			if (/user not found/i.test(err.reason)) {
				err.error = 1;
				err.reason = 'User or Password incorrect';
				err.message = 'User or Password incorrect';
			}
			if (typeof callback === 'function') {
				callback(err, null);
			}
			return Promise.reject(err);
		});
	},
	logout({ server }) {
		if (this.ddp) {
			this.ddp.logout();
		}
		database.deleteAll();
		AsyncStorage.removeItem(TOKEN_KEY);
		AsyncStorage.removeItem(`${ TOKEN_KEY }-${ server }`);
	},
	async getSettings() {
		const temp = database.objects('settings').sorted('_updatedAt', true)[0];
		const result = await (!temp ? call('public-settings/get') : call('public-settings/get', new Date(temp._updatedAt)));
		const settings = temp ? result.update : result;
		const filteredSettings = RocketChat._prepareSettings(RocketChat._filterSettings(settings));
		database.write(() => {
			filteredSettings.forEach(setting => database.create('settings', setting, true));
		});
		reduxStore.dispatch(actions.addSettings(RocketChat.parseSettings(filteredSettings)));
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
		const temp = database.objects('permissions').sorted('_updatedAt', true)[0];
		const result = await (!temp ? call('permissions/get') : call('permissions/get', new Date(temp._updatedAt)));
		let permissions = temp ? result.update : result;
		permissions = RocketChat._preparePermissions(permissions);
		database.write(() => {
			permissions.forEach(permission => database.create('permissions', permission, true));
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
	async getCustomEmoji() {
		const temp = database.objects('customEmojis').sorted('_updatedAt', true)[0];
		let emojis = await call('listEmojiCustom');
		emojis = emojis.filter(emoji => !temp || emoji._updatedAt > temp._updatedAt);
		emojis = RocketChat._prepareEmojis(emojis);
		database.write(() => {
			emojis.forEach(emoji => database.create('customEmojis', emoji, true));
		});
		reduxStore.dispatch(actions.setCustomEmojis(RocketChat.parseEmojis(emojis)));
	},
	parseEmojis: emojis => emojis.reduce((ret, item) => {
		ret[item.name] = item.extension;
		item.aliases.forEach((alias) => {
			ret[alias.value] = item.extension;
		});
		return ret;
	}, {}),
	_prepareEmojis(emojis) {
		emojis.forEach((emoji) => {
			emoji.aliases = emoji.aliases.map(alias => ({ value: alias }));
		});
		return emojis;
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
		const result = database.objects('subscriptions').filtered('rid = $0', rid);
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
		return this.ddp.subscribe(...args);
	},
	emitTyping(room, t = true) {
		const { login } = reduxStore.getState();
		return call('stream-notify-room', `${ room }/typing`, login.user.username, t);
	},
	setUserPresenceAway() {
		return call('UserPresence:away');
	},
	setUserPresenceOnline() {
		return call('UserPresence:online');
	},
	setUserPresenceDefaultStatus(status) {
		return call('UserPresence:setDefaultStatus', status);
	},
	setReaction(emoji, messageId) {
		return call('setReaction', emoji, messageId);
	}
};

export default RocketChat;

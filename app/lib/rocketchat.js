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
import { setUser, setLoginServices, removeLoginServices } from '../actions/login';
import { disconnect, disconnect_by_user, connectSuccess, connectFailure } from '../actions/connect';
import { requestActiveUser } from '../actions/activeUsers';
import { starredMessagesReceived, starredMessageUnstarred } from '../actions/starredMessages';
import { pinnedMessagesReceived, pinnedMessageUnpinned } from '../actions/pinnedMessages';
import { mentionedMessagesReceived } from '../actions/mentionedMessages';
import { snippetedMessagesReceived } from '../actions/snippetedMessages';
import { roomFilesReceived } from '../actions/roomFiles';
import Ddp from './ddp';

export { Accounts } from 'react-native-meteor';

const call = (method, ...params) => RocketChat.ddp.call(method, ...params); // eslint-disable-line
const TOKEN_KEY = 'reactnativemeteor_usertoken';
const SERVER_TIMEOUT = 30000;


const normalizeMessage = (lastMessage) => {
	if (lastMessage) {
		lastMessage.attachments = lastMessage.attachments || [];
		lastMessage.reactions = _.map(lastMessage.reactions, (value, key) =>
			({ emoji: key, usernames: value.usernames.map(username => ({ value: username })) }));
	}
	return lastMessage;
};


const RocketChat = {
	TOKEN_KEY,

	createChannel({ name, users, type }) {
		return call(type ? 'createChannel' : 'createPrivateGroup', name, users, type);
	},
	async createDirectMessageAndWait(username) {
		const room = await RocketChat.createDirectMessage(username);
		return new Promise((resolve) => {
			const data = database.objects('subscriptions')
				.filtered('rid = $1', room.rid);

			if (data.length) {
				return resolve(data[0]);
			}
			data.addListener(() => {
				if (!data.length) { return; }
				data.removeAllListeners();
				resolve(data[0]);
			});
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
		if (/^(https?:\/\/)?(((\w|[0-9-_])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(url)) {
			const response = await fetch(url, { method: 'HEAD' });
			if (response.status === 200 && response.headers.get('x-instance-id') != null && response.headers.get('x-instance-id').length) {
				return url;
			}
		}
		throw new Error({ error: 'invalid server' });
	},
	_setUser(ddpMessage) {
		this.activeUsers = this.activeUsers || {};
		const { user } = reduxStore.getState().login;

		const status = (ddpMessage.fields && ddpMessage.fields.status) || 'offline';

		if (user && user.id === ddpMessage.id) {
			reduxStore.dispatch(setUser({ status }));
		}

		if (this._setUserTimer) {
			clearTimeout(this._setUserTimer);
			this._setUserTimer = null;
		}


		this._setUserTimer = setTimeout(() => {
			reduxStore.dispatch(requestActiveUser(this.activeUsers));
			this._setUserTimer = null;
			return this.activeUsers = {};
		}, 5000);
		this.activeUsers[ddpMessage.id] = status;
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
			// this.ddp.on('open', async() => {
			// 	resolve(reduxStore.dispatch(connectSuccess()));
			// });
			this.ddp.on('connected', () => {
				resolve(reduxStore.dispatch(connectSuccess()));
				RocketChat.getSettings();
				RocketChat.getPermissions();
				RocketChat.getCustomEmoji();
			});

			this.ddp.on('error', (err) => {
				alert(JSON.stringify(err));
				reduxStore.dispatch(connectFailure());
			});

			this.ddp.on('connected', () => this.ddp.subscribe('activeUsers', null, false));

			this.ddp.on('users', ddpMessage => RocketChat._setUser(ddpMessage));

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
					if (data.blocker) {
						data.blocked = true;
					} else {
						data.blocked = false;
					}
					database.write(() => {
						database.create('subscriptions', data, true);
					});
				}
				if (/rooms/.test(ev) && type === 'updated') {
					const sub = database.objects('subscriptions').filtered('rid == $0', data._id)[0];

					database.write(() => {
						sub.roomUpdatedAt = data._updatedAt;
						sub.lastMessage = normalizeMessage(data.lastMessage);
						sub.ro = data.ro;
					});
				}
			});

			this.ddp.on('rocketchat_starred_message', (ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.starredMessages = this.starredMessages || [];

					if (this.starredMessagesTimer) {
						clearTimeout(this.starredMessagesTimer);
						this.starredMessagesTimer = null;
					}

					this.starredMessagesTimer = setTimeout(() => {
						reduxStore.dispatch(starredMessagesReceived(this.starredMessages));
						this.starredMessagesTimer = null;
						return this.starredMessages = [];
					}, 1000);
					const message = ddpMessage.fields;
					message._id = ddpMessage.id;
					const starredMessage = this._buildMessage(message);
					this.starredMessages = [...this.starredMessages, starredMessage];
				}
				if (ddpMessage.msg === 'removed') {
					if (reduxStore.getState().starredMessages.isOpen) {
						return reduxStore.dispatch(starredMessageUnstarred(ddpMessage.id));
					}
				}
			});

			this.ddp.on('rocketchat_pinned_message', (ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.pinnedMessages = this.pinnedMessages || [];

					if (this.pinnedMessagesTimer) {
						clearTimeout(this.pinnedMessagesTimer);
						this.pinnedMessagesTimer = null;
					}

					this.pinnedMessagesTimer = setTimeout(() => {
						reduxStore.dispatch(pinnedMessagesReceived(this.pinnedMessages));
						this.pinnedMessagesTimer = null;
						return this.pinnedMessages = [];
					}, 1000);
					const message = ddpMessage.fields;
					message._id = ddpMessage.id;
					const pinnedMessage = this._buildMessage(message);
					this.pinnedMessages = [...this.pinnedMessages, pinnedMessage];
				}
				if (ddpMessage.msg === 'removed') {
					if (reduxStore.getState().pinnedMessages.isOpen) {
						return reduxStore.dispatch(pinnedMessageUnpinned(ddpMessage.id));
					}
				}
			});

			this.ddp.on('rocketchat_mentioned_message', (ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.mentionedMessages = this.mentionedMessages || [];

					if (this.mentionedMessagesTimer) {
						clearTimeout(this.mentionedMessagesTimer);
						this.mentionedMessagesTimer = null;
					}

					this.mentionedMessagesTimer = setTimeout(() => {
						reduxStore.dispatch(mentionedMessagesReceived(this.mentionedMessages));
						this.mentionedMessagesTimer = null;
						return this.mentionedMessages = [];
					}, 1000);
					const message = ddpMessage.fields;
					message._id = ddpMessage.id;
					const mentionedMessage = this._buildMessage(message);
					this.mentionedMessages = [...this.mentionedMessages, mentionedMessage];
				}
			});

			this.ddp.on('rocketchat_snippeted_message', (ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.snippetedMessages = this.snippetedMessages || [];

					if (this.snippetedMessagesTimer) {
						clearTimeout(this.snippetedMessagesTimer);
						this.snippetedMessagesTimer = null;
					}

					this.snippetedMessagesTimer = setTimeout(() => {
						reduxStore.dispatch(snippetedMessagesReceived(this.snippetedMessages));
						this.snippetedMessagesTimer = null;
						return this.snippetedMessages = [];
					}, 1000);
					const message = ddpMessage.fields;
					message._id = ddpMessage.id;
					const snippetedMessage = this._buildMessage(message);
					this.snippetedMessages = [...this.snippetedMessages, snippetedMessage];
				}
			});

			this.ddp.on('room_files', (ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.roomFiles = this.roomFiles || [];

					if (this.roomFilesTimer) {
						clearTimeout(this.roomFilesTimer);
						this.roomFilesTimer = null;
					}

					this.roomFilesTimer = setTimeout(() => {
						reduxStore.dispatch(roomFilesReceived(this.roomFiles));
						this.roomFilesTimer = null;
						return this.roomFiles = [];
					}, 1000);
					const { fields } = ddpMessage;
					const message = {
						_id: ddpMessage.id,
						ts: fields.uploadedAt,
						msg: fields.description,
						status: 0,
						attachments: [{
							title: fields.name
						}],
						urls: [],
						reactions: [],
						u: {
							username: fields.user.username
						}
					};
					const fileUrl = `/file-upload/${ ddpMessage.id }/${ fields.name }`;
					if (/image/.test(fields.type)) {
						message.attachments[0].image_type = fields.type;
						message.attachments[0].image_url = fileUrl;
					} else if (/audio/.test(fields.type)) {
						message.attachments[0].audio_type = fields.type;
						message.attachments[0].audio_url = fileUrl;
					} else if (/video/.test(fields.type)) {
						message.attachments[0].video_type = fields.type;
						message.attachments[0].video_url = fileUrl;
					}
					this.roomFiles = [...this.roomFiles, message];
				}
			});

			this.ddp.on('meteor_accounts_loginServiceConfiguration', (ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.loginServices = this.loginServices || {};
					if (this.loginServiceTimer) {
						clearTimeout(this.loginServiceTimer);
						this.loginServiceTimer = null;
					}
					this.loginServiceTimer = setTimeout(() => {
						reduxStore.dispatch(setLoginServices(this.loginServices));
						this.loginServiceTimer = null;
						return this.loginServices = {};
					}, 1000);
					this.loginServices[ddpMessage.fields.service] = { ...ddpMessage.fields };
					delete this.loginServices[ddpMessage.fields.service].service;
				} else if (ddpMessage.msg === 'removed') {
					if (this.loginServiceTimer) {
						clearTimeout(this.loginServiceTimer);
					}
					this.loginServiceTimer = setTimeout(() => reduxStore.dispatch(removeLoginServices()), 1000);
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
		normalizeMessage(message);
		message.urls = message.urls ? RocketChat._parseUrls(message.urls) : [];
		message._updatedAt = new Date();
		// loadHistory returns message.starred as object
		// stream-room-messages returns message.starred as an array
		message.starred = message.starred && (Array.isArray(message.starred) ? message.starred.length > 0 : !!message.starred);
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
	async readMessages(rid) {
		const ret = await call('readMessages', rid);

		const [subscription] = database.objects('subscriptions').filtered('rid = $0', rid);
		database.write(() => {
			subscription.lastOpen = new Date();
		});

		return ret;
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
		const placeholder = RocketChat.getMessage(rid, 'Sending a file');
		try {
			if (!data) {
				data = await RNFetchBlob.wrap(fileInfo.path);
				const fileStat = await RNFetchBlob.fs.stat(fileInfo.path);
				fileInfo.size = fileStat.size;
				fileInfo.name = fileStat.filename;
			}

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
			try {
				database.write(() => {
					const msg = database.objects('messages').filtered('_id = $0', placeholder._id);
					database.delete(msg);
				});
			} catch (e) {
				console.error(e);
			}
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
				subscription.lastMessage = normalizeMessage(room.lastMessage);
				subscription.ro = room.ro;
				subscription.description = room.description;
				subscription.topic = room.topic;
				subscription.announcement = room.announcement;
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
	},
	toggleFavorite(rid, f) {
		return call('toggleFavorite', rid, !f);
	},
	getRoomMembers(rid, allUsers) {
		return call('getUsersOfRoom', rid, allUsers);
	},
	toggleBlockUser(rid, blocked, block) {
		if (block) {
			return call('blockUser', { rid, blocked });
		}
		return call('unblockUser', { rid, blocked });
	},
	leaveRoom(rid) {
		return call('leaveRoom', rid);
	}
};

export default RocketChat;

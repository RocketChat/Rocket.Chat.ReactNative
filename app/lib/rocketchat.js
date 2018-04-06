import { AsyncStorage, Platform } from 'react-native';
import { hashPassword } from 'react-native-meteor/lib/utils';
import _ from 'lodash';
import { Answers } from 'react-native-fabric';

import RNFetchBlob from 'react-native-fetch-blob';
import reduxStore from './createStore';
import settingsType from '../constants/settings';
import messagesStatus from '../constants/messagesStatus';
import database from './realm';
import * as actions from '../actions';
import { someoneTyping, roomMessageReceived } from '../actions/room';
import { setUser, setLoginServices, removeLoginServices, loginRequest, loginSuccess, loginFailure } from '../actions/login';
import { disconnect, connectSuccess, connectFailure } from '../actions/connect';
import { setActiveUser } from '../actions/activeUsers';
import { starredMessagesReceived, starredMessageUnstarred } from '../actions/starredMessages';
import { pinnedMessagesReceived, pinnedMessageUnpinned } from '../actions/pinnedMessages';
import { mentionedMessagesReceived } from '../actions/mentionedMessages';
import { snippetedMessagesReceived } from '../actions/snippetedMessages';
import { roomFilesReceived } from '../actions/roomFiles';
import { setRoles } from '../actions/roles';
import Ddp from './ddp';

import normalizeMessage from './methods/helpers/normalizeMessage';

import subscribeRooms from './methods/subscriptions/room';


import readMessages from './methods/readMessages';
import getRooms from './methods/getRooms';
import _buildMessage from './methods/helpers/buildMessage';
import loadMessagesForRoom from './methods/loadMessagesForRoom';
import sendMessage, { getMessage, _sendMessageCall } from './methods/sendMessage';

export { Accounts } from 'react-native-meteor';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const call = (method, ...params) => RocketChat.ddp.call(method, ...params); // eslint-disable-line
const returnAnArray = obj => obj || [];

const protectedFunction = fn => (params) => {
	try {
		fn(params);
	} catch (e) {
		Answers.log(e);
		console.log(e);
	}
};

const RocketChat = {
	TOKEN_KEY,
	subscribeRooms,
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
			reduxStore.dispatch(setActiveUser(this.activeUsers));
			this._setUserTimer = null;
			return this.activeUsers = {};
		}, 1000);

		this.activeUsers[ddpMessage.id] = ddpMessage.fields;
	},
	connect(url, login) {
		return new Promise((resolve) => {
			if (this.ddp) {
				this.ddp.disconnect();
				delete this.ddp;
			}

			this.ddp = new Ddp(url, login);
			if (login) {
				protectedFunction(() => RocketChat.getRooms());
			}

			this.ddp.on('login', protectedFunction(() => reduxStore.dispatch(loginRequest())));

			this.ddp.on('users', protectedFunction(ddpMessage => RocketChat._setUser(ddpMessage)));

			this.ddp.on('logged', protectedFunction(() => {
				RocketChat.getRooms();
			}));

			this.ddp.on('logged', protectedFunction(async(user) => {
				// GET /me from REST API
				const me = await this.me({ token: user.token, userId: user.id });
				if (me.username) {
					const userInfo = await this.userInfo({ token: user.token, userId: user.id });
					user.username = me.username;//= userInfo.user.username;
					if (userInfo.user.roles) {
						user.roles = userInfo.user.roles;
					}
				}

				reduxStore.dispatch(loginSuccess(user));
				this.getRooms().catch(alert);
				// if user has username
			}));
			this.ddp.once('logged', protectedFunction(({ id }) => this.subscribeRooms(id)));

			this.ddp.on('logginError', protectedFunction(err => reduxStore.dispatch(loginFailure(err))));

			this.ddp.on('open', protectedFunction(() => {
				RocketChat.getSettings();
				RocketChat.getPermissions();
				RocketChat.getCustomEmoji();
				reduxStore.dispatch(connectSuccess());
				resolve();
			}));

			this.ddp.once('open', protectedFunction(() => {
				this.ddp.subscribe('activeUsers');
				this.ddp.subscribe('roles');
			}));

			this.ddp.on('disconnected', protectedFunction(() => {
				reduxStore.dispatch(disconnect());
			}));

			this.ddp.on('stream-room-messages', protectedFunction((ddpMessage) => {
				const message = _buildMessage(ddpMessage.fields.args[0]);
				return reduxStore.dispatch(roomMessageReceived(message));
			}));

			this.ddp.on('stream-notify-room', protectedFunction((ddpMessage) => {
				const [_rid, ev] = ddpMessage.fields.eventName.split('/');
				if (ev !== 'typing') {
					return;
				}
				return reduxStore.dispatch(someoneTyping({ _rid, username: ddpMessage.fields.args[0], typing: ddpMessage.fields.args[1] }));
			}));

			this.ddp.on('stream-notify-user', protectedFunction((ddpMessage) => {
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
						sub.description = data.description;
						sub.topic = data.topic;
						sub.announcement = data.announcement;
						sub.reactWhenReadOnly = data.reactWhenReadOnly;
						sub.archived = data.archived;
						sub.joinCodeRequired = data.joinCodeRequired;
					});
				}
			}));

			this.ddp.on('rocketchat_starred_message', protectedFunction((ddpMessage) => {
				if (ddpMessage.msg === 'added') {
					this.starredMessages = this.starredMessages || [];

					if (this.starredMessagesTimer) {
						clearTimeout(this.starredMessagesTimer);
						this.starredMessagesTimer = null;
					}

					this.starredMessagesTimer = setTimeout(protectedFunction(() => {
						reduxStore.dispatch(starredMessagesReceived(this.starredMessages));
						this.starredMessagesTimer = null;
						return this.starredMessages = [];
					}), 1000);
					const message = ddpMessage.fields;
					message._id = ddpMessage.id;
					const starredMessage = _buildMessage(message);
					this.starredMessages = [...this.starredMessages, starredMessage];
				}
				if (ddpMessage.msg === 'removed') {
					if (reduxStore.getState().starredMessages.isOpen) {
						return reduxStore.dispatch(starredMessageUnstarred(ddpMessage.id));
					}
				}
			}));

			this.ddp.on('rocketchat_pinned_message', protectedFunction((ddpMessage) => {
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
					const pinnedMessage = _buildMessage(message);
					this.pinnedMessages = [...this.pinnedMessages, pinnedMessage];
				}
				if (ddpMessage.msg === 'removed') {
					if (reduxStore.getState().pinnedMessages.isOpen) {
						return reduxStore.dispatch(pinnedMessageUnpinned(ddpMessage.id));
					}
				}
			}));

			this.ddp.on('rocketchat_mentioned_message', protectedFunction((ddpMessage) => {
				if (ddpMessage.msg === 'added') { return; }
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
				const mentionedMessage = _buildMessage(message);
				this.mentionedMessages = [...this.mentionedMessages, mentionedMessage];
			}));

			this.ddp.on('rocketchat_snippeted_message', protectedFunction((ddpMessage) => {
				if (ddpMessage.msg === 'added') { return; }
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
				const snippetedMessage = _buildMessage(message);
				this.snippetedMessages = [...this.snippetedMessages, snippetedMessage];
			}));

			this.ddp.on('room_files', protectedFunction((ddpMessage) => {
				if (!ddpMessage.msg === 'added') { return; }
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
			}));

			this.ddp.on('meteor_accounts_loginServiceConfiguration', protectedFunction((ddpMessage) => {
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
			}));

			this.ddp.on('rocketchat_roles', protectedFunction((ddpMessage) => {
				this.roles = this.roles || {};

				if (this.roleTimer) {
					clearTimeout(this.roleTimer);
					this.roleTimer = null;
				}
				this.roleTimer = setTimeout(() => {
					reduxStore.dispatch(setRoles(this.roles));

					database.write(() => {
						_.forEach(this.roles, (description, _id) => {
							database.create('roles', { _id, description }, true);
						});
					});

					this.roleTimer = null;
					return this.roles = {};
				}, 5000);
				this.roles[ddpMessage.id] = ddpMessage.fields.description;
			}));

			this.ddp.on('error', protectedFunction((err) => {
				Answers.log(err);
				reduxStore.dispatch(connectFailure());
			}));
		}).catch(err => alert(`asd ${ err }`));
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
	loadMessagesForRoom,
	getMessage,
	sendMessage,
	getRooms,
	readMessages,
	me({ server = reduxStore.getState().server.server, token, userId }) {
		return fetch(`${ server }/api/v1/me`, {
			method: 'get',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token': token,
				'X-User-Id': userId
			}
		}).then(response => response.json());
	},

	userInfo({ server = reduxStore.getState().server.server, token, userId }) {
		return fetch(`${ server }/api/v1/users.info?userId=${ userId }`, {
			method: 'get',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token': token,
				'X-User-Id': userId
			}
		}).then(response => response.json());
	},
	async resendMessage(messageId) {
		const message = await database.objects('messages').filtered('_id = $0', messageId)[0];
		database.write(() => {
			message.status = messagesStatus.TEMP;
			database.create('messages', message, true);
		});
		return _sendMessageCall(JSON.parse(JSON.stringify(message)));
	},

	spotlight(search, usernames, type) {
		return call('spotlight', search, usernames, type);
	},

	createDirectMessage(username) {
		return call('createDirectMessage', username);
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
			// TODO: fix that
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
	login(params) {
		return this.ddp.login(params);
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
		const [result] = database.objects('subscriptions').filtered('rid = $0', rid);
		if (!result) {
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
	getUserRoles() {
		return call('getUserRoles');
	},
	async getRoomMember(rid, currentUserId) {
		try {
			const membersResult = await RocketChat.getRoomMembers(rid, true);
			return Promise.resolve(membersResult.records.find(m => m.id !== currentUserId));
		} catch (error) {
			return Promise.reject(error);
		}
	},
	toggleBlockUser(rid, blocked, block) {
		if (block) {
			return call('blockUser', { rid, blocked });
		}
		return call('unblockUser', { rid, blocked });
	},
	leaveRoom(rid) {
		return call('leaveRoom', rid);
	},
	eraseRoom(rid) {
		return call('eraseRoom', rid);
	},
	toggleArchiveRoom(rid, archive) {
		if (archive) {
			return call('archiveRoom', rid);
		}
		return call('unarchiveRoom', rid);
	},
	saveRoomSettings(rid, params) {
		return call('saveRoomSettings', rid, params);
	},
	hasPermission(permissions, rid) {
		// get the room from realm
		const room = database.objects('subscriptions').filtered('rid = $0', rid)[0];
		// get room roles
		const { roles } = room;
		// transform room roles to array
		const roomRoles = Array.from(Object.keys(roles), i => roles[i].value);
		// get user roles on the server from redux
		const userRoles = reduxStore.getState().login.user.roles || [];
		// get all permissions from redux
		const allPermissions = reduxStore.getState().permissions;
		// merge both roles
		const mergedRoles = [...new Set([...roomRoles, ...userRoles])];

		// return permissions in object format
		// e.g. { 'edit-room': true, 'set-readonly': false }
		return permissions.reduce((result, permission) => {
			result[permission] = returnAnArray(allPermissions[permission])
				.some(item => mergedRoles.indexOf(item) !== -1);
			return result;
		}, {});
	}
};

export default RocketChat;

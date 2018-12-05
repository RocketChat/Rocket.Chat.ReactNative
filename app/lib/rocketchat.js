import { AsyncStorage, Platform } from 'react-native';
import foreach from 'lodash/forEach';
import RNFetchBlob from 'rn-fetch-blob';
import * as SDK from '@rocket.chat/sdk';

import reduxStore from './createStore';
import defaultSettings from '../constants/settings';
import messagesStatus from '../constants/messagesStatus';
import database from './realm';
import log from '../utils/log';

import {
	setUser, setLoginServices, loginRequest, loginFailure, logout
} from '../actions/login';
import { disconnect, connectSuccess, connectRequest } from '../actions/connect';
import { setActiveUser } from '../actions/activeUsers';
import { starredMessagesReceived, starredMessageUnstarred } from '../actions/starredMessages';
import { pinnedMessagesReceived, pinnedMessageUnpinned } from '../actions/pinnedMessages';
import { mentionedMessagesReceived } from '../actions/mentionedMessages';
import { snippetedMessagesReceived } from '../actions/snippetedMessages';
import { roomFilesReceived } from '../actions/roomFiles';
import { someoneTyping, roomMessageReceived } from '../actions/room';
import { setRoles } from '../actions/roles';

import subscribeRooms from './methods/subscriptions/rooms';
import subscribeRoom from './methods/subscriptions/room';

import protectedFunction from './methods/helpers/protectedFunction';
import readMessages from './methods/readMessages';
import getSettings from './methods/getSettings';

import getRooms from './methods/getRooms';
import getPermissions from './methods/getPermissions';
import getCustomEmoji from './methods/getCustomEmojis';
import canOpenRoom from './methods/canOpenRoom';

import _buildMessage from './methods/helpers/buildMessage';
import loadMessagesForRoom from './methods/loadMessagesForRoom';
import loadMissedMessages from './methods/loadMissedMessages';

import sendMessage, { getMessage, sendMessageCall } from './methods/sendMessage';
import { sendFileMessage, cancelUpload, isUploadActive } from './methods/sendFileMessage';

import { getDeviceToken } from '../push';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';
const call = (method, ...params) => SDK.driver.asyncCall(method, ...params);
const returnAnArray = obj => obj || [];

const RocketChat = {
	TOKEN_KEY,
	subscribeRooms,
	subscribeRoom,
	canOpenRoom,
	createChannel({
		name, users, type, readOnly, broadcast
	}) {
		return call(type ? 'createPrivateGroup' : 'createChannel', name, users, readOnly, {}, { broadcast });
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
	_hasInstanceId(headers) {
		return !!headers[Object.keys(headers).find(item => item.toLowerCase() === 'x-instance-id')];
	},
	async testServer(url) {
		try {
			let response = await RNFetchBlob.fetch('HEAD', url);
			response = response.respInfo;
			if (response.status === 200 && RocketChat._hasInstanceId(response.headers)) {
				return url;
			}
		} catch (e) {
			log('testServer', e);
		}
		throw new Error({ error: 'invalid server' });
	},
	_setUser(ddpMessage) {
		this.activeUsers = this.activeUsers || {};
		const { user } = reduxStore.getState().login;

		if (ddpMessage.fields && user && user.id === ddpMessage.id) {
			reduxStore.dispatch(setUser(ddpMessage.fields));
		}

		if (this._setUserTimer) {
			clearTimeout(this._setUserTimer);
			this._setUserTimer = null;
		}

		this._setUserTimer = setTimeout(() => {
			reduxStore.dispatch(setActiveUser(this.activeUsers));
			this._setUserTimer = null;
			return this.activeUsers = {};
		}, 2000);

		const activeUser = reduxStore.getState().activeUsers[ddpMessage.id];
		if (!ddpMessage.fields) {
			this.activeUsers[ddpMessage.id] = {};
		} else {
			this.activeUsers[ddpMessage.id] = { ...this.activeUsers[ddpMessage.id], ...activeUser, ...ddpMessage.fields };
		}
	},
	loginSuccess({ user }) {
		SDK.driver.login({ resume: user.token });
		reduxStore.dispatch(setUser(user));
		this.getRooms().catch(e => console.log(e));
		this.getPermissions();
		this.getCustomEmoji();
		this.registerPushToken().then(result => console.log(result)).catch(e => alert(e));
	},
	connect({ server, user }) {
		database.setActiveDB(server);

		if (this.ddp) {
			RocketChat.disconnect();
			this.ddp = null;
		}

		SDK.api.setBaseUrl(server);
		this.getSettings();

		if (user && user.token) {
			reduxStore.dispatch(loginRequest({ resume: user.token }));
		}

		// Use useSsl: false only if server url starts with http://
		const useSsl = !/http:\/\//.test(server);

		reduxStore.dispatch(connectRequest());
		SDK.driver.connect({ host: server, useSsl }, (err, ddp) => {
			if (err) {
				return console.warn(err);
			}
			this.ddp = ddp;
			if (user && user.token) {
				SDK.driver.login({ resume: user.token });
			}
		});

		SDK.driver.on('connected', () => {
			reduxStore.dispatch(connectSuccess());
		});

		SDK.driver.on('disconnected', protectedFunction(() => {
			reduxStore.dispatch(disconnect());
		}));

		SDK.driver.on('logged', protectedFunction((error, u) => {
			this.subscribeRooms(u.id);
			SDK.driver.subscribe('activeUsers');
			SDK.driver.subscribe('roles');
		}));

		SDK.driver.on('forbidden', protectedFunction(() => reduxStore.dispatch(logout())));

		SDK.driver.on('users', protectedFunction((error, ddpMessage) => RocketChat._setUser(ddpMessage)));

		SDK.driver.on('stream-room-messages', (error, ddpMessage) => {
			// TODO: debounce
			const message = _buildMessage(ddpMessage.fields.args[0]);
			requestAnimationFrame(() => reduxStore.dispatch(roomMessageReceived(message)));
		});

		SDK.driver.on('stream-notify-room', protectedFunction((error, ddpMessage) => {
			const [_rid, ev] = ddpMessage.fields.eventName.split('/');
			if (ev === 'typing') {
				reduxStore.dispatch(someoneTyping({ _rid, username: ddpMessage.fields.args[0], typing: ddpMessage.fields.args[1] }));
			} else if (ev === 'deleteMessage') {
				database.write(() => {
					if (ddpMessage && ddpMessage.fields && ddpMessage.fields.args.length > 0) {
						const { _id } = ddpMessage.fields.args[0];
						const message = database.objects('messages').filtered('_id = $0', _id);
						database.delete(message);
					}
				});
			}
		}));

		SDK.driver.on('rocketchat_starred_message', protectedFunction((error, ddpMessage) => {
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

		SDK.driver.on('rocketchat_pinned_message', protectedFunction((error, ddpMessage) => {
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

		SDK.driver.on('rocketchat_mentioned_message', protectedFunction((error, ddpMessage) => {
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
				const mentionedMessage = _buildMessage(message);
				this.mentionedMessages = [...this.mentionedMessages, mentionedMessage];
			}
		}));

		SDK.driver.on('rocketchat_snippeted_message', protectedFunction((error, ddpMessage) => {
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
				const snippetedMessage = _buildMessage(message);
				this.snippetedMessages = [...this.snippetedMessages, snippetedMessage];
			}
		}));

		SDK.driver.on('room_files', protectedFunction((error, ddpMessage) => {
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
		}));

		SDK.driver.on('rocketchat_roles', protectedFunction((error, ddpMessage) => {
			this.roles = this.roles || {};

			if (this.roleTimer) {
				clearTimeout(this.roleTimer);
				this.roleTimer = null;
			}
			this.roleTimer = setTimeout(() => {
				reduxStore.dispatch(setRoles(this.roles));

				database.write(() => {
					foreach(this.roles, (description, _id) => {
						database.create('roles', { _id, description }, true);
					});
				});

				this.roleTimer = null;
				return this.roles = {};
			}, 1000);
			this.roles[ddpMessage.id] = (ddpMessage.fields && ddpMessage.fields.description) || undefined;
		}));
	},

	register(credentials) {
		return SDK.api.post('users.register', credentials, false);
	},

	setUsername(username) {
		return call('setUsername', username);
	},

	forgotPassword(email) {
		return SDK.api.post('users.forgotPassword', { email }, false);
	},

	async loginWithPassword({ user, password, code }) {
		let params = { user, password };
		const state = reduxStore.getState();

		if (state.settings.LDAP_Enable) {
			params = {
				...params,
				ldap: true,
				ldapOptions: {}
			};
		} else if (state.settings.CROWD_Enable) {
			params = {
				...params,
				crowd: true
			};
		}

		if (code) {
			params = {
				...params,
				code
			};
		}

		try {
			return await this.login(params);
		} catch (error) {
			throw error;
		}
	},

	async loginOAuth(params) {
		try {
			const result = await SDK.driver.login(params);
			reduxStore.dispatch(loginRequest({ resume: result.token }));
		} catch (error) {
			throw error;
		}
	},

	async login(params) {
		try {
			return await SDK.api.login(params);
		} catch (e) {
			reduxStore.dispatch(loginFailure(e));
			throw e;
		}
	},
	async logout({ server }) {
		// this.removePushToken().catch(error => console.log(error));
		try {
			await this.removePushToken();
		} catch (error) {
			console.log('logout -> removePushToken -> catch -> error', error);
		}
		try {
			await SDK.api.logout();
		} catch (error) {
			console.log('​logout -> api logout -> catch -> error', error);
		}
		SDK.driver.ddp.disconnect();
		this.ddp = null;

		Promise.all([
			AsyncStorage.removeItem('currentServer'),
			AsyncStorage.removeItem(TOKEN_KEY),
			AsyncStorage.removeItem(`${ TOKEN_KEY }-${ server }`)
		]).catch(error => console.log(error));

		try {
			database.deleteAll();
		} catch (error) {
			console.log(error);
		}
	},
	disconnect() {
		try {
			SDK.driver.unsubscribeAll();
		} catch (error) {
			console.log(error);
		}
		RocketChat.setApiUser({ userId: null, authToken: null });
	},
	setApiUser({ userId, authToken }) {
		SDK.api.setAuth({ userId, authToken });
		SDK.api.currentLogin = null;
	},
	registerPushToken() {
		return new Promise((resolve) => {
			const token = getDeviceToken();
			if (token) {
				const type = Platform.OS === 'ios' ? 'apn' : 'gcm';
				const data = {
					value: token,
					type,
					appName: 'chat.rocket.reactnative' // TODO: try to get from config file
				};
				return SDK.api.post('push.token', data);
			}
			return resolve();
		});
	},
	removePushToken() {
		const token = getDeviceToken();
		if (token) {
			return SDK.api.del('push.token', { token });
		}
		return Promise.resolve();
	},
	loadMissedMessages,
	loadMessagesForRoom,
	getMessage,
	sendMessage,
	getRooms,
	readMessages,
	async resendMessage(messageId) {
		const message = await database.objects('messages').filtered('_id = $0', messageId)[0];
		try {
			database.write(() => {
				message.status = messagesStatus.TEMP;
				database.create('messages', message, true);
			});
			await sendMessageCall.call(this, JSON.parse(JSON.stringify(message)));
		} catch (error) {
			database.write(() => {
				message.status = messagesStatus.ERROR;
				database.create('messages', message, true);
			});
		}
	},

	async search({ text, filterUsers = true, filterRooms = true }) {
		const searchText = text.trim();

		if (this.oldPromise) {
			this.oldPromise('cancel');
		}

		if (searchText === '') {
			delete this.oldPromise;
			return [];
		}

		let data = database.objects('subscriptions').filtered('name CONTAINS[c] $0', searchText);

		if (filterUsers && !filterRooms) {
			data = data.filtered('t = $0', 'd');
		} else if (!filterUsers && filterRooms) {
			data = data.filtered('t != $0', 'd');
		}
		data = data.slice(0, 7);
		const array = Array.from(data);
		data = JSON.parse(JSON.stringify(array));

		const usernames = data.map(sub => sub.name);
		try {
			if (data.length < 7) {
				const { users, rooms } = await Promise.race([
					RocketChat.spotlight(searchText, usernames, { users: filterUsers, rooms: filterRooms }),
					new Promise((resolve, reject) => this.oldPromise = reject)
				]);

				data = data.concat(users.map(user => ({
					...user,
					rid: user.username,
					name: user.username,
					t: 'd',
					search: true
				})), rooms.map(room => ({
					rid: room._id,
					...room,
					search: true
				})));
			}
			delete this.oldPromise;
			return data;
		} catch (e) {
			console.warn(e);
			return data;
			// return [];
		}
	},

	spotlight(search, usernames, type) {
		return call('spotlight', search, usernames, type);
	},

	createDirectMessage(username) {
		return SDK.api.post('im.create', { username });
	},
	joinRoom(roomId) {
		// TODO: join code
		return SDK.api.post('channels.join', { roomId });
	},
	sendFileMessage,
	cancelUpload,
	isUploadActive,
	getSettings,
	getPermissions,
	getCustomEmoji,
	parseSettings: settings => settings.reduce((ret, item) => {
		ret[item._id] = item[defaultSettings[item._id].type];
		return ret;
	}, {}),
	_prepareSettings(settings) {
		return settings.map((setting) => {
			setting[defaultSettings[setting._id].type] = setting.value;
			return setting;
		});
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
		const { _id, rid } = message;
		return SDK.api.post('chat.delete', { roomId: rid, msgId: _id });
	},
	editMessage(message) {
		const { _id, msg, rid } = message;
		return SDK.api.post('chat.update', { roomId: rid, msgId: _id, text: msg });
	},
	toggleStarMessage(message) {
		if (message.starred) {
			return SDK.api.post('chat.unStarMessage', { messageId: message._id });
		}
		return SDK.api.post('chat.starMessage', { messageId: message._id });
	},
	togglePinMessage(message) {
		if (message.pinned) {
			return SDK.api.post('chat.unPinMessage', { messageId: message._id });
		}
		return SDK.api.post('chat.pinMessage', { messageId: message._id });
	},
	getRoom(rid) {
		const [result] = database.objects('subscriptions').filtered('rid = $0', rid);
		if (!result) {
			return Promise.reject(new Error('Room not found'));
		}
		return Promise.resolve(result);
	},
	getRoomInfo(roomId) {
		return SDK.api.get('rooms.info', { roomId });
	},
	async getPermalink(message) {
		let room;
		try {
			room = await RocketChat.getRoom(message.rid);
		} catch (e) {
			log('SDK.getPermalink', e);
			return null;
		}
		const { server } = reduxStore.getState().server;
		const roomType = {
			p: 'group',
			c: 'channel',
			d: 'direct'
		}[room.t];
		return `${ server }/${ roomType }/${ room.name }?msg=${ message._id }`;
	},
	subscribe(...args) {
		return SDK.driver.subscribe(...args);
	},
	unsubscribe(subscription) {
		return SDK.driver.unsubscribe(subscription);
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
		return SDK.api.post('chat.react', { emoji, messageId });
	},
	toggleFavorite(roomId, favorite) {
		return SDK.api.post('rooms.favorite', { roomId, favorite });
	},
	getRoomMembers(rid, allUsers) {
		return call('getUsersOfRoom', rid, allUsers);
	},
	getUserRoles() {
		return call('getUserRoles');
	},
	getRoomCounters(roomId, t) {
		return SDK.api.get(`${ this.roomTypeToApiType(t) }.counters`, { roomId });
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
	leaveRoom(roomId, t) {
		return SDK.api.post(`${ this.roomTypeToApiType(t) }.leave`, { roomId });
	},
	eraseRoom(rid) {
		return call('eraseRoom', rid);
	},
	toggleMuteUserInRoom(rid, username, mute) {
		if (mute) {
			return call('muteUserInRoom', { rid, username });
		}
		return call('unmuteUserInRoom', { rid, username });
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
	saveUserProfile(params, customFields) {
		return call('saveUserProfile', params, customFields);
	},
	saveUserPreferences(params) {
		return call('saveUserPreferences', params);
	},
	saveNotificationSettings(roomId, notifications) {
		return SDK.api.post('rooms.saveNotification', { roomId, notifications });
	},
	messageSearch(text, rid, limit) {
		return call('messageSearch', text, rid, limit);
	},
	addUsersToRoom(rid) {
		let { users } = reduxStore.getState().selectedUsers;
		users = users.map(u => u.name);
		return call('addUsersToRoom', { rid, users });
	},
	hasPermission(permissions, rid) {
		// get the room from realm
		const room = database.objects('subscriptions').filtered('rid = $0', rid)[0];
		// get permissions from realm
		const permissionsFiltered = database.objects('permissions')
			.filter(permission => permissions.includes(permission._id));
		// get room roles
		const { roles } = room;
		// transform room roles to array
		const roomRoles = Array.from(Object.keys(roles), i => roles[i].value);
		// get user roles on the server from redux
		const userRoles = (reduxStore.getState().login.user && reduxStore.getState().login.user.roles) || [];
		// merge both roles
		const mergedRoles = [...new Set([...roomRoles, ...userRoles])];

		// return permissions in object format
		// e.g. { 'edit-room': true, 'set-readonly': false }
		return permissions.reduce((result, permission) => {
			result[permission] = false;
			const permissionFound = permissionsFiltered.find(p => p._id === permission);
			if (permissionFound) {
				result[permission] = returnAnArray(permissionFound.roles).some(r => mergedRoles.includes(r.value));
			}
			return result;
		}, {});
	},
	getAvatarSuggestion() {
		return call('getAvatarSuggestion');
	},
	resetAvatar() {
		return call('resetAvatar');
	},
	setAvatarFromService({ data, contentType = '', service = null }) {
		return call('setAvatarFromService', data, contentType, service);
	},
	async getSortPreferences() {
		const prefs = await AsyncStorage.getItem(SORT_PREFS_KEY);
		return JSON.parse(prefs);
	},
	async saveSortPreference(param) {
		try {
			let prefs = await RocketChat.getSortPreferences();
			prefs = { ...prefs, ...param };
			return await AsyncStorage.setItem(SORT_PREFS_KEY, JSON.stringify(prefs));
		} catch (error) {
			console.warn(error);
		}
	},
	async getLoginServices(server) {
		try {
			let loginServicesFilter = [];
			const loginServicesResult = await fetch(`${ server }/api/v1/settings.oauth`).then(response => response.json());
			// TODO: remove this after SAML and custom oauth
			const availableOAuth = ['facebook', 'github', 'gitlab', 'google', 'linkedin', 'meteor-developer', 'twitter'];
			if (loginServicesResult.success && loginServicesResult.services.length > 0) {
				const { services } = loginServicesResult;
				loginServicesFilter = services.filter(item => availableOAuth.includes(item.name));
				const loginServicesReducer = loginServicesFilter.reduce((ret, item) => {
					ret[item.name] = item;
					return ret;
				}, {});
				reduxStore.dispatch(setLoginServices(loginServicesReducer));
			}
			return Promise.resolve(loginServicesFilter.length);
		} catch (error) {
			console.warn(error);
			return Promise.reject();
		}
	},
	getUsernameSuggestion() {
		return SDK.api.get('users.getUsernameSuggestion');
	},
	roomTypeToApiType(t) {
		const types = {
			c: 'channels', d: 'im', p: 'groups'
		};
		return types[t];
	}
};

export default RocketChat;

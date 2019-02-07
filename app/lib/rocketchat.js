import { AsyncStorage } from 'react-native';
import foreach from 'lodash/forEach';
import semver from 'semver';
import { Rocketchat as RocketchatClient } from '@rocket.chat/sdk';

import reduxStore from './createStore';
import defaultSettings from '../constants/settings';
import messagesStatus from '../constants/messagesStatus';
import database from './realm';
import log from '../utils/log';
import { isIOS, getBundleId } from '../utils/deviceInfo';

import {
	setUser, setLoginServices, loginRequest, loginFailure, logout
} from '../actions/login';
import { disconnect, connectSuccess, connectRequest } from '../actions/connect';
import { setActiveUser } from '../actions/activeUsers';
import { snippetedMessagesReceived } from '../actions/snippetedMessages';
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
import { roomsRequest } from '../actions/rooms';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';
const returnAnArray = obj => obj || [];
const MIN_ROCKETCHAT_VERSION = '0.66.0';

const RocketChat = {
	TOKEN_KEY,
	subscribeRooms,
	subscribeRoom,
	canOpenRoom,
	createChannel({
		name, users, type, readOnly, broadcast
	}) {
		// RC 0.51.0
		return this.sdk.methodCall(type ? 'createPrivateGroup' : 'createChannel', name, users, readOnly, {}, { broadcast });
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
	async testServer(server) {
		try {
			const result = await fetch(`${ server }/api/v1/info`).then(response => response.json());
			if (result.success && result.info) {
				if (semver.lt(result.info.version, MIN_ROCKETCHAT_VERSION)) {
					return {
						success: false,
						message: 'Invalid_server_version',
						messageOptions: {
							currentVersion: result.info.version,
							minVersion: MIN_ROCKETCHAT_VERSION
						}
					};
				}
				return {
					success: true
				};
			}
		} catch (e) {
			log('testServer', e);
		}
		return {
			success: false,
			message: 'The_URL_is_invalid'
		};
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
		reduxStore.dispatch(setUser(user));
		reduxStore.dispatch(roomsRequest());
		this.subscribeRooms();
		this.sdk.subscribe('activeUsers');
		this.sdk.subscribe('roles');
		this.getPermissions();
		this.getCustomEmoji();
		this.registerPushToken().then(result => console.log(result)).catch(e => console.log(e));
	},
	connect({ server, user }) {
		database.setActiveDB(server);
		reduxStore.dispatch(connectRequest());

		if (this.connectTimeout) {
			clearTimeout(this.connectTimeout);
		}

		// Use useSsl: false only if server url starts with http://
		const useSsl = !/http:\/\//.test(server);

		this.sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl });
		this.getSettings();

		this.sdk.connect()
			.then(() => {
				if (user && user.token) {
					reduxStore.dispatch(loginRequest({ resume: user.token }));
				}
			})
			.catch((err) => {
				console.log('connect error', err);

				// when `connect` raises an error, we try again in 10 seconds
				this.connectTimeout = setTimeout(() => {
					this.connect({ server, user });
				}, 10000);
			});

		this.sdk.onStreamData('connected', () => {
			reduxStore.dispatch(connectSuccess());
		});

		this.sdk.onStreamData('close', () => {
			reduxStore.dispatch(disconnect());
		});

		this.sdk.onStreamData('users', protectedFunction(ddpMessage => RocketChat._setUser(ddpMessage)));

		this.sdk.onStreamData('stream-room-messages', (ddpMessage) => {
			// TODO: debounce
			const message = _buildMessage(ddpMessage.fields.args[0]);
			requestAnimationFrame(() => reduxStore.dispatch(roomMessageReceived(message)));
		});

		this.sdk.onStreamData('stream-notify-room', protectedFunction((ddpMessage) => {
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

		this.sdk.onStreamData('rocketchat_snippeted_message', protectedFunction((ddpMessage) => {
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

		this.sdk.onStreamData('rocketchat_roles', protectedFunction((ddpMessage) => {
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
		// RC 0.50.0
		return this.sdk.post('users.register', credentials, false);
	},

	setUsername(username) {
		// RC 0.51.0
		return this.sdk.methodCall('setUsername', username);
	},

	forgotPassword(email) {
		// RC 0.64.0
		return this.sdk.post('users.forgotPassword', { email }, false);
	},

	async loginWithPassword({ user, password, code }) {
		let params = { user, password };
		const state = reduxStore.getState();

		if (state.settings.LDAP_Enable) {
			params = {
				username: user,
				ldapPass: password,
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
			const result = await this.login(params);
			reduxStore.dispatch(loginRequest({ resume: result.token }));
		} catch (error) {
			throw error;
		}
	},

	async login(params) {
		try {
			// RC 0.64.0
			await this.sdk.login(params);
			const { result } = this.sdk.currentLogin;
			const user = {
				id: result.userId,
				token: result.authToken,
				username: result.me.username,
				name: result.me.name,
				language: result.me.language,
				status: result.me.status,
				customFields: result.me.customFields,
				emails: result.me.emails
			};
			return user;
		} catch (e) {
			if (e.data && e.data.message && /you've been logged out by the server/i.test(e.data.message)) {
				reduxStore.dispatch(logout({ server: this.sdk.client.host }));
			} else {
				reduxStore.dispatch(loginFailure(e));
			}
			throw e;
		}
	},
	async logout({ server }) {
		try {
			await this.removePushToken();
		} catch (error) {
			console.log('logout -> removePushToken -> catch -> error', error);
		}
		try {
			// RC 0.60.0
			await this.sdk.logout();
		} catch (error) {
			console.log('​logout -> api logout -> catch -> error', error);
		}
		this.sdk = null;

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
	registerPushToken() {
		return new Promise((resolve) => {
			const token = getDeviceToken();
			if (token) {
				const type = isIOS ? 'apn' : 'gcm';
				const data = {
					value: token,
					type,
					appName: getBundleId
				};
				// RC 0.60.0
				return this.sdk.post('push.token', data);
			}
			return resolve();
		});
	},
	removePushToken() {
		const token = getDeviceToken();
		if (token) {
			// RC 0.60.0
			return this.sdk.del('push.token', { token });
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
		// RC 0.51.0
		return this.sdk.methodCall('spotlight', search, usernames, type);
	},

	createDirectMessage(username) {
		// RC 0.59.0
		return this.sdk.post('im.create', { username });
	},
	joinRoom(roomId) {
		// TODO: join code
		// RC 0.48.0
		return this.sdk.post('channels.join', { roomId });
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
		// RC 0.48.0
		return this.sdk.post('chat.delete', { roomId: rid, msgId: _id });
	},
	editMessage(message) {
		const { _id, msg, rid } = message;
		// RC 0.49.0
		return this.sdk.post('chat.update', { roomId: rid, msgId: _id, text: msg });
	},
	toggleStarMessage(message) {
		if (message.starred) {
			// RC 0.59.0
			return this.sdk.post('chat.unStarMessage', { messageId: message._id });
		}
		// RC 0.59.0
		return this.sdk.post('chat.starMessage', { messageId: message._id });
	},
	togglePinMessage(message) {
		if (message.pinned) {
			// RC 0.59.0
			return this.sdk.post('chat.unPinMessage', { messageId: message._id });
		}
		// RC 0.59.0
		return this.sdk.post('chat.pinMessage', { messageId: message._id });
	},
	getRoom(rid) {
		const [result] = database.objects('subscriptions').filtered('rid = $0', rid);
		if (!result) {
			return Promise.reject(new Error('Room not found'));
		}
		return Promise.resolve(result);
	},
	async getPermalink(message) {
		let room;
		try {
			room = await RocketChat.getRoom(message.rid);
		} catch (e) {
			log('Rocketchat.getPermalink', e);
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
		return this.sdk.subscribe(...args);
	},
	unsubscribe(subscription) {
		return this.sdk.unsubscribe(subscription);
	},
	emitTyping(room, t = true) {
		const { login } = reduxStore.getState();
		return this.sdk.methodCall('stream-notify-room', `${ room }/typing`, login.user.username, t);
	},
	setUserPresenceAway() {
		return this.sdk.methodCall('UserPresence:away');
	},
	setUserPresenceOnline() {
		return this.sdk.methodCall('UserPresence:online');
	},
	setUserPresenceDefaultStatus(status) {
		return this.sdk.methodCall('UserPresence:setDefaultStatus', status);
	},
	setReaction(emoji, messageId) {
		// RC 0.62.2
		return this.sdk.post('chat.react', { emoji, messageId });
	},
	toggleFavorite(roomId, favorite) {
		// RC 0.64.0
		return this.sdk.post('rooms.favorite', { roomId, favorite });
	},
	getRoomMembers(rid, allUsers) {
		// RC 0.42.0
		return this.sdk.methodCall('getUsersOfRoom', rid, allUsers);
	},
	getUserRoles() {
		// RC 0.27.0
		return this.sdk.methodCall('getUserRoles');
	},
	getRoomCounters(roomId, t) {
		// RC 0.65.0
		return this.sdk.get(`${ this.roomTypeToApiType(t) }.counters`, { roomId });
	},
	async getRoomMember(rid, currentUserId) {
		try {
			if (rid === `${ currentUserId }${ currentUserId }`) {
				return Promise.resolve(currentUserId);
			}
			const membersResult = await RocketChat.getRoomMembers(rid, true);
			return Promise.resolve(membersResult.records.find(m => m._id !== currentUserId));
		} catch (error) {
			return Promise.reject(error);
		}
	},
	toggleBlockUser(rid, blocked, block) {
		if (block) {
			// RC 0.49.0
			return this.sdk.methodCall('blockUser', { rid, blocked });
		}
		// RC 0.49.0
		return this.sdk.methodCall('unblockUser', { rid, blocked });
	},
	leaveRoom(roomId, t) {
		// RC 0.48.0
		return this.sdk.post(`${ this.roomTypeToApiType(t) }.leave`, { roomId });
	},
	eraseRoom(roomId, t) {
		// RC 0.49.0
		return this.sdk.post(`${ this.roomTypeToApiType(t) }.delete`, { roomId });
	},
	toggleMuteUserInRoom(rid, username, mute) {
		if (mute) {
			// RC 0.51.0
			return this.sdk.methodCall('muteUserInRoom', { rid, username });
		}
		// RC 0.51.0
		return this.sdk.methodCall('unmuteUserInRoom', { rid, username });
	},
	toggleArchiveRoom(roomId, t, archive) {
		if (archive) {
			// RC 0.48.0
			return this.sdk.post(`${ this.roomTypeToApiType(t) }.archive`, { roomId });
		}
		// RC 0.48.0
		return this.sdk.post(`${ this.roomTypeToApiType(t) }.unarchive`, { roomId });
	},
	saveRoomSettings(rid, params) {
		// RC 0.55.0
		return this.sdk.methodCall('saveRoomSettings', rid, params);
	},
	saveUserProfile(data) {
		// RC 0.62.2
		return this.sdk.post('users.updateOwnBasicInfo', { data });
	},
	saveUserPreferences(params) {
		// RC 0.51.0
		return this.sdk.methodCall('saveUserPreferences', params);
	},
	saveNotificationSettings(roomId, notifications) {
		// RC 0.63.0
		return this.sdk.post('rooms.saveNotification', { roomId, notifications });
	},
	addUsersToRoom(rid) {
		let { users } = reduxStore.getState().selectedUsers;
		users = users.map(u => u.name);
		// RC 0.51.0
		return this.sdk.methodCall('addUsersToRoom', { rid, users });
	},
	hasPermission(permissions, rid) {
		let roles = [];
		try {
			// get the room from realm
			const room = database.objects('subscriptions').filtered('rid = $0', rid)[0];
			// get room roles
			roles = room.roles; // eslint-disable-line prefer-destructuring
		} catch (error) {
			console.log('hasPermission -> error', error);
		}
		// get permissions from realm
		const permissionsFiltered = database.objects('permissions')
			.filter(permission => permissions.includes(permission._id));
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
		// RC 0.51.0
		return this.sdk.methodCall('getAvatarSuggestion');
	},
	resetAvatar(userId) {
		// RC 0.55.0
		return this.sdk.post('users.resetAvatar', { userId });
	},
	setAvatarFromService({ data, contentType = '', service = null }) {
		// RC 0.51.0
		return this.sdk.methodCall('setAvatarFromService', data, contentType, service);
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
		// RC 0.65.0
		return this.sdk.get('users.getUsernameSuggestion');
	},
	roomTypeToApiType(t) {
		const types = {
			c: 'channels', d: 'im', p: 'groups'
		};
		return types[t];
	},
	getFiles(roomId, type, offset) {
		// RC 0.59.0
		return this.sdk.get(`${ this.roomTypeToApiType(type) }.files`, {
			roomId,
			offset,
			sort: { uploadedAt: -1 },
			fields: {
				name: 1, description: 1, size: 1, type: 1, uploadedAt: 1, url: 1, userId: 1
			}
		});
	},
	getMessages(roomId, type, query, offset) {
		// RC 0.59.0
		return this.sdk.get(`${ this.roomTypeToApiType(type) }.messages`, {
			roomId,
			query,
			offset,
			sort: { ts: -1 }
		});
	},
	searchMessages(roomId, searchText) {
		// RC 0.60.0
		return this.sdk.get('chat.search', {
			roomId,
			searchText
		});
	}
};

export default RocketChat;

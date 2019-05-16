import { AsyncStorage, InteractionManager } from 'react-native';
import semver from 'semver';
import { Rocketchat as RocketchatClient } from '@rocket.chat/sdk';

import reduxStore from './createStore';
import defaultSettings from '../constants/settings';
import messagesStatus from '../constants/messagesStatus';
import database, { safeAddListener } from './realm';
import log from '../utils/log';
import { isIOS, getBundleId } from '../utils/deviceInfo';
import EventEmitter from '../utils/events';

import {
	setUser, setLoginServices, loginRequest, loginFailure, logout
} from '../actions/login';
import { disconnect, connectSuccess, connectRequest } from '../actions/connect';

import subscribeRooms from './methods/subscriptions/rooms';
import subscribeRoom from './methods/subscriptions/room';

import protectedFunction from './methods/helpers/protectedFunction';
import readMessages from './methods/readMessages';
import getSettings from './methods/getSettings';

import getRooms from './methods/getRooms';
import getPermissions from './methods/getPermissions';
import getCustomEmoji from './methods/getCustomEmojis';
import getRoles from './methods/getRoles';
import canOpenRoom from './methods/canOpenRoom';

import loadMessagesForRoom from './methods/loadMessagesForRoom';
import loadMissedMessages from './methods/loadMissedMessages';
import loadThreadMessages from './methods/loadThreadMessages';

import sendMessage, { getMessage, sendMessageCall } from './methods/sendMessage';
import { sendFileMessage, cancelUpload, isUploadActive } from './methods/sendFileMessage';

import { getDeviceToken } from '../push';
import { roomsRequest } from '../actions/rooms';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';
const returnAnArray = obj => obj || [];
const MIN_ROCKETCHAT_VERSION = '0.70.0';

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
			safeAddListener(data, () => {
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
	async getServerInfo(server) {
		try {
			const result = await fetch(`${ server }/api/info`).then(response => response.json());
			if (result.success) {
				if (semver.lt(result.version, MIN_ROCKETCHAT_VERSION)) {
					return {
						success: false,
						message: 'Invalid_server_version',
						messageOptions: {
							currentVersion: result.version,
							minVersion: MIN_ROCKETCHAT_VERSION
						}
					};
				}
				return result;
			}
		} catch (e) {
			log('getServerInfo', e);
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

		if (ddpMessage.cleared && user && user.id === ddpMessage.id) {
			reduxStore.dispatch(setUser({ status: 'offline' }));
		}

		if (!this._setUserTimer) {
			this._setUserTimer = setTimeout(() => {
				const batchUsers = this.activeUsers;
				InteractionManager.runAfterInteractions(() => {
					database.memoryDatabase.write(() => {
						Object.keys(batchUsers).forEach((key) => {
							if (batchUsers[key] && batchUsers[key].id) {
								try {
									const data = batchUsers[key];
									if (data.removed) {
										const userRecord = database.memoryDatabase.objectForPrimaryKey('activeUsers', data.id);
										if (userRecord) {
											userRecord.status = 'offline';
										}
									} else {
										database.memoryDatabase.create('activeUsers', data, true);
									}
								} catch (error) {
									console.log(error);
								}
							}
						});
					});
				});
				this._setUserTimer = null;
				return this.activeUsers = {};
			}, 10000);
		}

		if (!ddpMessage.fields) {
			this.activeUsers[ddpMessage.id] = {
				id: ddpMessage.id,
				removed: true
			};
		} else {
			this.activeUsers[ddpMessage.id] = {
				id: ddpMessage.id, ...this.activeUsers[ddpMessage.id], ...ddpMessage.fields
			};
		}
	},
	async loginSuccess({ user }) {
		EventEmitter.emit('connected');
		reduxStore.dispatch(setUser(user));
		reduxStore.dispatch(roomsRequest());

		if (this.roomsSub) {
			this.roomsSub.stop();
		}
		this.roomsSub = await this.subscribeRooms();

		this.getPermissions();
		this.getCustomEmoji();
		this.getRoles();
		this.registerPushToken().catch(e => console.log(e));

		if (this.activeUsersSubTimeout) {
			clearTimeout(this.activeUsersSubTimeout);
			this.activeUsersSubTimeout = false;
		}
		this.activeUsersSubTimeout = setTimeout(() => {
			this.sdk.subscribe('activeUsers');
		}, 5000);
	},
	connect({ server, user }) {
		database.setActiveDB(server);
		reduxStore.dispatch(connectRequest());

		if (this.connectTimeout) {
			clearTimeout(this.connectTimeout);
		}

		if (this.sdk) {
			this.sdk.disconnect();
			this.sdk = null;
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
				user,
				password,
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
				emails: result.me.emails,
				roles: result.me.roles
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
		if (this.roomsSub) {
			this.roomsSub.stop();
		}

		if (this.activeUsersSubTimeout) {
			clearTimeout(this.activeUsersSubTimeout);
			this.activeUsersSubTimeout = false;
		}

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
	loadThreadMessages,
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
			try {
				database.write(() => {
					message.status = messagesStatus.ERROR;
					database.create('messages', message, true);
				});
			} catch (e) {
				log('resendMessage error', e);
			}
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
	getRoles,
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
	reportMessage(messageId) {
		return this.sdk.post('chat.reportMessage', { messageId, description: 'Message reported by user' });
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
	onStreamData(...args) {
		return this.sdk.onStreamData(...args);
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
	getRoomMembers(rid, allUsers, skip = 0, limit = 10) {
		// RC 0.42.0
		return this.sdk.methodCall('getUsersOfRoom', rid, allUsers, { skip, limit });
	},
	getUserRoles() {
		// RC 0.27.0
		return this.sdk.methodCall('getUserRoles');
	},
	getRoomCounters(roomId, t) {
		// RC 0.65.0
		return this.sdk.get(`${ this.roomTypeToApiType(t) }.counters`, { roomId });
	},
	getChannelInfo(roomId) {
		// RC 0.48.0
		return this.sdk.get('channels.info', { roomId });
	},
	getUserInfo(userId) {
		// RC 0.48.0
		return this.sdk.get('users.info', { userId });
	},
	getRoomMemberId(rid, currentUserId) {
		if (rid === `${ currentUserId }${ currentUserId }`) {
			return currentUserId;
		}
		return rid.replace(currentUserId, '').trim();
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
	getSingleMessage(msgId) {
		// RC 0.57.0
		return this.sdk.methodCall('getSingleMessage', msgId);
	},
	hasPermission(permissions, rid) {
		let roomRoles = [];
		try {
			// get the room from realm
			const [room] = database.objects('subscriptions').filtered('rid = $0', rid);
			if (!room) {
				return permissions.reduce((result, permission) => {
					result[permission] = false;
					return result;
				}, {});
			}
			// get room roles
			roomRoles = room.roles;
		} catch (error) {
			console.log('hasPermission -> error', error);
		}
		// get permissions from realm
		const permissionsFiltered = database.objects('permissions')
			.filter(permission => permissions.includes(permission._id));
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
				result[permission] = returnAnArray(permissionFound.roles).some(r => mergedRoles.includes(r));
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
	},
	toggleFollowMessage(mid, follow) {
		// RC 1.0
		if (follow) {
			return this.sdk.post('chat.followMessage', { mid });
		}
		return this.sdk.post('chat.unfollowMessage', { mid });
	},
	getThreadsList({ rid, count, offset }) {
		// RC 1.0
		return this.sdk.get('chat.getThreadsList', {
			rid, count, offset, sort: { ts: -1 }
		});
	},
	getSyncThreadsList({ rid, updatedSince }) {
		// RC 1.0
		return this.sdk.get('chat.syncThreadsList', {
			rid, updatedSince
		});
	}
};

export default RocketChat;

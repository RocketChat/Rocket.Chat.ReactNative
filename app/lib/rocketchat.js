import { AsyncStorage, InteractionManager } from 'react-native';
import semver from 'semver';
import { Rocketchat as RocketchatClient } from '@rocket.chat/sdk';
import RNUserDefaults from 'rn-user-defaults';

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
import {
	shareSelectServer, shareSetUser
} from '../actions/share';

import subscribeRooms from './methods/subscriptions/rooms';
import subscribeRoom from './methods/subscriptions/room';

import protectedFunction from './methods/helpers/protectedFunction';
import readMessages from './methods/readMessages';
import getSettings from './methods/getSettings';

import getRooms from './methods/getRooms';
import getPermissions from './methods/getPermissions';
import getCustomEmojis from './methods/getCustomEmojis';
import getSlashCommands from './methods/getSlashCommands';
import getRoles from './methods/getRoles';
import canOpenRoom from './methods/canOpenRoom';

import loadMessagesForRoom from './methods/loadMessagesForRoom';
import loadMissedMessages from './methods/loadMissedMessages';
import loadThreadMessages from './methods/loadThreadMessages';

import sendMessage, { getMessage, sendMessageCall } from './methods/sendMessage';
import { sendFileMessage, cancelUpload, isUploadActive } from './methods/sendFileMessage';

import { getDeviceToken } from '../notifications/push';
import { SERVERS, SERVER_URL } from '../constants/userDefaults';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';
export const MARKDOWN_KEY = 'RC_MARKDOWN_KEY';
const returnAnArray = obj => obj || [];
const MIN_ROCKETCHAT_VERSION = '0.70.0';

const STATUSES = ['offline', 'online', 'away', 'busy'];

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
	async getUserToken() {
		try {
			return await RNUserDefaults.get(TOKEN_KEY);
		} catch (error) {
			console.warn(`RNUserDefaults error: ${ error.message }`);
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
			log('err_get_server_info', e);
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
	connect({ server, user }) {
		return new Promise((resolve) => {
			database.setActiveDB(server);
			reduxStore.dispatch(connectRequest());

			if (this.connectTimeout) {
				clearTimeout(this.connectTimeout);
			}

			if (this.roomsSub) {
				this.roomsSub.stop();
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
				// const { isAuthenticated } = reduxStore.getState().login;
				// if (isAuthenticated) {
				// 	this.getUserPresence();
				// }
			});

			this.sdk.onStreamData('close', () => {
				reduxStore.dispatch(disconnect());
			});

			this.sdk.onStreamData('users', protectedFunction(ddpMessage => RocketChat._setUser(ddpMessage)));

			this.sdk.onStreamData('stream-notify-logged', protectedFunction((ddpMessage) => {
				const { eventName } = ddpMessage.fields;
				if (eventName === 'user-status') {
					const userStatus = ddpMessage.fields.args[0];
					const [id, username, status] = userStatus;
					if (username) {
						database.memoryDatabase.write(() => {
							try {
								database.memoryDatabase.create('activeUsers', {
									id, username, status: STATUSES[status]
								}, true);
							} catch (error) {
								console.log(error);
							}
						});
					}
				}
			}));

			resolve();
		});
	},

	async shareExtensionInit(server) {
		database.setActiveDB(server);

		if (this.sdk) {
			this.sdk.disconnect();
			this.sdk = null;
		}

		// Use useSsl: false only if server url starts with http://
		const useSsl = !/http:\/\//.test(server);

		this.sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl });

		// set Server
		const { serversDB } = database.databases;
		reduxStore.dispatch(shareSelectServer(server));

		// set User info
		const userId = await RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ server }`);
		const user = userId && serversDB.objectForPrimaryKey('user', userId);
		reduxStore.dispatch(shareSetUser({
			id: user.id,
			token: user.token,
			username: user.username
		}));

		await RocketChat.login({ resume: user.token });
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

	async loginOAuthOrSso(params) {
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

		try {
			const servers = await RNUserDefaults.objectForKey(SERVERS);
			await RNUserDefaults.setObjectForKey(SERVERS, servers && servers.filter(srv => srv[SERVER_URL] !== server));
		} catch (error) {
			console.log('logout_rn_user_defaults', error);
		}

		const { serversDB } = database.databases;

		const userId = await RNUserDefaults.get(`${ TOKEN_KEY }-${ server }`);

		serversDB.write(() => {
			const user = serversDB.objectForPrimaryKey('user', userId);
			serversDB.delete(user);
		});

		Promise.all([
			RNUserDefaults.clear('currentServer'),
			RNUserDefaults.clear(TOKEN_KEY),
			RNUserDefaults.clear(`${ TOKEN_KEY }-${ server }`)
		]).catch(error => console.log(error));

		try {
			database.deleteAll();
		} catch (error) {
			console.log(error);
		}
	},
	registerPushToken() {
		return new Promise(async(resolve) => {
			const token = getDeviceToken();
			if (token) {
				const type = isIOS ? 'apn' : 'gcm';
				const data = {
					value: token,
					type,
					appName: getBundleId
				};
				try {
					// RC 0.60.0
					await this.sdk.post('push.token', data);
				} catch (error) {
					console.log(error);
				}
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
				log('err_resend_message', e);
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
	joinRoom(roomId, type) {
		// TODO: join code
		// RC 0.48.0
		if (type === 'p') {
			return this.sdk.methodCall('joinRoom', roomId);
		}
		return this.sdk.post('channels.join', { roomId });
	},
	sendFileMessage,
	cancelUpload,
	isUploadActive,
	getSettings,
	getPermissions,
	getCustomEmojis,
	getSlashCommands,
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
	async getPermalinkMessage(message) {
		let room;
		try {
			room = await RocketChat.getRoom(message.rid);
		} catch (e) {
			log('err_get_permalink', e);
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
	getPermalinkChannel(channel) {
		const { server } = reduxStore.getState().server;
		const roomType = {
			p: 'group',
			c: 'channel',
			d: 'direct'
		}[channel.t];
		return `${ server }/${ roomType }/${ channel.name }`;
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
	toggleRead(read, roomId) {
		if (read) {
			return this.sdk.post('subscriptions.unread', { roomId });
		}
		return this.sdk.post('subscriptions.read', { rid: roomId });
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
	getRoomInfo(roomId) {
		// RC 0.72.0
		return this.sdk.get('rooms.info', { roomId });
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
	hideRoom(roomId, t) {
		return this.sdk.post(`${ this.roomTypeToApiType(t) }.close`, { roomId });
	},
	saveRoomSettings(rid, params) {
		// RC 0.55.0
		return this.sdk.methodCall('saveRoomSettings', rid, params);
	},
	saveUserProfile(data, customFields) {
		// RC 0.62.2
		return this.sdk.post('users.updateOwnBasicInfo', { data, customFields });
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
	async getUseMarkdown() {
		const useMarkdown = await AsyncStorage.getItem(MARKDOWN_KEY);
		if (useMarkdown === null) {
			return true;
		}
		return JSON.parse(useMarkdown);
	},
	async getSortPreferences() {
		const prefs = await RNUserDefaults.objectForKey(SORT_PREFS_KEY);
		return prefs;
	},
	async saveSortPreference(param) {
		try {
			let prefs = await RocketChat.getSortPreferences();
			prefs = { ...prefs, ...param };
			return await RNUserDefaults.setObjectForKey(SORT_PREFS_KEY, prefs);
		} catch (error) {
			console.warn(error);
		}
	},
	async getLoginServices(server) {
		try {
			let loginServices = [];
			const loginServicesResult = await fetch(`${ server }/api/v1/settings.oauth`).then(response => response.json());

			if (loginServicesResult.success && loginServicesResult.services.length > 0) {
				const { services } = loginServicesResult;
				loginServices = services;

				const loginServicesReducer = loginServices.reduce((ret, item) => {
					const name = item.name || item.buttonLabelText || item.service;
					const authType = this._determineAuthType(item);

					if (authType !== 'not_supported') {
						ret[name] = { ...item, name, authType };
					}

					return ret;
				}, {});
				reduxStore.dispatch(setLoginServices(loginServicesReducer));
			}
			return Promise.resolve(loginServices.length);
		} catch (error) {
			console.warn(error);
			return Promise.reject();
		}
	},
	_determineAuthType(services) {
		const { name, custom, service } = services;

		if (custom) {
			return 'oauth_custom';
		}

		if (service === 'saml') {
			return 'saml';
		}

		if (service === 'cas') {
			return 'cas';
		}

		// TODO: remove this after other oauth providers are implemented. e.g. Drupal, github_enterprise
		const availableOAuth = ['facebook', 'github', 'gitlab', 'google', 'linkedin', 'meteor-developer', 'twitter'];
		return availableOAuth.includes(name) ? 'oauth' : 'not_supported';
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

	getReadReceipts(messageId) {
		return this.sdk.get('chat.getMessageReadReceipts', {
			messageId
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
	},
	runSlashCommand(command, roomId, params) {
		// RC 0.60.2
		return this.sdk.post('commands.run', {
			command, roomId, params
		});
	},
	getCommandPreview(command, roomId, params) {
		// RC 0.65.0
		return this.sdk.get('commands.preview', {
			command, roomId, params
		});
	},
	executeCommandPreview(command, params, roomId, previewItem) {
		// RC 0.65.0
		return this.sdk.post('commands.preview', {
			command, params, roomId, previewItem
		});
	},
	getUserPresence() {
		return new Promise(async(resolve) => {
			const serverVersion = reduxStore.getState().server.version;

			// if server is lower than 1.1.0
			if (semver.lt(semver.coerce(serverVersion), '1.1.0')) {
				if (this.activeUsersSubTimeout) {
					clearTimeout(this.activeUsersSubTimeout);
					this.activeUsersSubTimeout = false;
				}
				this.activeUsersSubTimeout = setTimeout(() => {
					this.sdk.subscribe('activeUsers');
				}, 5000);
				return resolve();
			} else {
				const params = {};
				// if (this.lastUserPresenceFetch) {
				// 	params.from = this.lastUserPresenceFetch.toISOString();
				// }

				// RC 1.1.0
				const result = await this.sdk.get('users.presence', params);
				if (result.success) {
					// this.lastUserPresenceFetch = new Date();
					database.memoryDatabase.write(() => {
						result.users.forEach((item) => {
							try {
								item.id = item._id;
								database.memoryDatabase.create('activeUsers', item, true);
							} catch (error) {
								console.log(error);
							}
						});
					});
					this.sdk.subscribe('stream-notify-logged', 'user-status');
					return resolve();
				}
			}
		});
	},
	getDirectory({
		query, count, offset, sort
	}) {
		// RC 1.0
		return this.sdk.get('directory', {
			query, count, offset, sort
		});
	},
	canAutoTranslate() {
		try {
			const AutoTranslate_Enabled = reduxStore.getState().settings && reduxStore.getState().settings.AutoTranslate_Enabled;
			if (!AutoTranslate_Enabled) {
				return false;
			}
			const autoTranslatePermission = database.objectForPrimaryKey('permissions', 'auto-translate');
			const userRoles = (reduxStore.getState().login.user && reduxStore.getState().login.user.roles) || [];
			return autoTranslatePermission.roles.some(role => userRoles.includes(role));
		} catch (error) {
			log('err_can_auto_translate', error);
			return false;
		}
	},
	saveAutoTranslate({
		rid, field, value, options
	}) {
		return this.sdk.methodCall('autoTranslate.saveSettings', rid, field, value, options);
	},
	getSupportedLanguagesAutoTranslate() {
		return this.sdk.methodCall('autoTranslate.getSupportedLanguages', 'en');
	},
	translateMessage(message, targetLanguage) {
		return this.sdk.methodCall('autoTranslate.translateMessage', message, targetLanguage);
	}
};

export default RocketChat;

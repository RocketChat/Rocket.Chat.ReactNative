import { AsyncStorage, InteractionManager } from 'react-native';
import semver from 'semver';
import { Rocketchat as RocketchatClient } from '@rocket.chat/sdk';
import RNUserDefaults from 'rn-user-defaults';
import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system';

import reduxStore from './createStore';
import defaultSettings from '../constants/settings';
import messagesStatus from '../constants/messagesStatus';
import database from './database';
import log from '../utils/log';
import { isIOS, getBundleId } from '../utils/deviceInfo';
import { extractHostname } from '../utils/server';
import fetch, { BASIC_AUTH_KEY } from '../utils/fetch';

import { setUser, setLoginServices, loginRequest } from '../actions/login';
import { disconnect, connectSuccess, connectRequest } from '../actions/connect';
import {
	shareSelectServer, shareSetUser
} from '../actions/share';

import subscribeRooms from './methods/subscriptions/rooms';
import getUsersPresence, { getUserPresence, subscribeUsersPresence } from './methods/getUsersPresence';

import protectedFunction from './methods/helpers/protectedFunction';
import readMessages from './methods/readMessages';
import getSettings, { getLoginSettings, setSettings } from './methods/getSettings';

import getRooms from './methods/getRooms';
import getPermissions from './methods/getPermissions';
import { getCustomEmojis, setCustomEmojis } from './methods/getCustomEmojis';
import getSlashCommands from './methods/getSlashCommands';
import getRoles from './methods/getRoles';
import canOpenRoom from './methods/canOpenRoom';
import triggerBlockAction, { triggerSubmitView, triggerCancel } from './methods/actions';

import loadMessagesForRoom from './methods/loadMessagesForRoom';
import loadMissedMessages from './methods/loadMissedMessages';
import loadThreadMessages from './methods/loadThreadMessages';

import sendMessage, { sendMessageCall } from './methods/sendMessage';
import { sendFileMessage, cancelUpload, isUploadActive } from './methods/sendFileMessage';

import callJitsi from './methods/callJitsi';

import { getDeviceToken } from '../notifications/push';
import { SERVERS, SERVER_URL } from '../constants/userDefaults';
import { setActiveUsers } from '../actions/activeUsers';
import I18n from '../i18n';
import { twoFactor } from '../utils/twoFactor';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';
export const THEME_PREFERENCES_KEY = 'RC_THEME_PREFERENCES_KEY';
export const CRASH_REPORT_KEY = 'RC_CRASH_REPORT_KEY';
const returnAnArray = obj => obj || [];
const MIN_ROCKETCHAT_VERSION = '0.70.0';

const STATUSES = ['offline', 'online', 'away', 'busy'];

const RocketChat = {
	TOKEN_KEY,
	callJitsi,
	async subscribeRooms() {
		if (!this.roomsSub) {
			try {
				this.roomsSub = await subscribeRooms.call(this);
			} catch (e) {
				log(e);
			}
		}
	},
	canOpenRoom,
	createChannel({
		name, users, type, readOnly, broadcast
	}) {
		// RC 0.51.0
		return this.methodCall(type ? 'createPrivateGroup' : 'createChannel', name, users, readOnly, {}, { broadcast });
	},
	async getUserToken() {
		try {
			return await RNUserDefaults.get(TOKEN_KEY);
		} catch (error) {
			console.warn(`RNUserDefaults error: ${ error.message }`);
		}
	},
	async getWebsocketInfo({ server }) {
		// Use useSsl: false only if server url starts with http://
		const useSsl = !/http:\/\//.test(server);

		const sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl });

		try {
			await sdk.connect();
		} catch (err) {
			if (err.message && err.message.includes('400')) {
				return {
					success: false,
					message: 'Websocket_disabled',
					messageOptions: {
						contact: I18n.t('Contact_your_server_admin')
					}
				};
			}
		}

		sdk.disconnect();

		return {
			success: true
		};
	},
	async getServerInfo(server) {
		const notRCServer = {
			success: false,
			message: 'Not_RC_Server',
			messageOptions: {
				contact: I18n.t('Contact_your_server_admin')
			}
		};
		try {
			const result = await fetch(`${ server }/api/info`).then(async(response) => {
				let res = notRCServer;
				try {
					res = await response.json();
					if (!(res && res.success)) {
						return notRCServer;
					}
				} catch (e) {
					// do nothing
				}
				return res;
			});
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
			}
			return result;
		} catch (e) {
			log(e);
		}
		return {
			success: false,
			message: 'The_URL_is_invalid',
			messageOptions: {
				contact: I18n.t('Contact_your_server_admin')
			}
		};
	},
	stopListener(listener) {
		return listener && listener.stop();
	},
	connect({ server, user, logoutOnError = false }) {
		return new Promise((resolve) => {
			if (!this.sdk || this.sdk.client.host !== server) {
				database.setActiveDB(server);
			}
			reduxStore.dispatch(connectRequest());

			if (this.connectTimeout) {
				clearTimeout(this.connectTimeout);
			}

			if (this.connectedListener) {
				this.connectedListener.then(this.stopListener);
			}

			if (this.closeListener) {
				this.closeListener.then(this.stopListener);
			}

			if (this.usersListener) {
				this.usersListener.then(this.stopListener);
			}

			if (this.notifyLoggedListener) {
				this.notifyLoggedListener.then(this.stopListener);
			}

			if (this.roomsSub) {
				this.roomsSub.stop();
				this.roomsSub = null;
			}

			if (this.sdk) {
				this.sdk.disconnect();
				this.sdk = null;
			}

			if (this.code) {
				this.code = null;
			}

			// Use useSsl: false only if server url starts with http://
			const useSsl = !/http:\/\//.test(server);

			this.sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl });
			this.getSettings();

			const sdkConnect = () => this.sdk.connect()
				.then(() => {
					if (user && user.token) {
						reduxStore.dispatch(loginRequest({ resume: user.token }, logoutOnError));
					}
				})
				.catch((err) => {
					console.log('connect error', err);

					// when `connect` raises an error, we try again in 10 seconds
					this.connectTimeout = setTimeout(() => {
						sdkConnect();
					}, 10000);
				});

			sdkConnect();

			this.connectedListener = this.sdk.onStreamData('connected', () => {
				reduxStore.dispatch(connectSuccess());
			});

			this.closeListener = this.sdk.onStreamData('close', () => {
				reduxStore.dispatch(disconnect());
			});

			this.usersListener = this.sdk.onStreamData('users', protectedFunction(ddpMessage => RocketChat._setUser(ddpMessage)));

			this.notifyLoggedListener = this.sdk.onStreamData('stream-notify-logged', protectedFunction((ddpMessage) => {
				const { eventName } = ddpMessage.fields;
				if (eventName === 'user-status') {
					this.activeUsers = this.activeUsers || {};
					if (!this._setUserTimer) {
						this._setUserTimer = setTimeout(() => {
							const activeUsersBatch = this.activeUsers;
							InteractionManager.runAfterInteractions(() => {
								reduxStore.dispatch(setActiveUsers(activeUsersBatch));
							});
							this._setUserTimer = null;
							return this.activeUsers = {};
						}, 10000);
					}
					const userStatus = ddpMessage.fields.args[0];
					const [id,, status, statusText] = userStatus;
					this.activeUsers[id] = { status: STATUSES[status], statusText };

					const { user: loggedUser } = reduxStore.getState().login;
					if (loggedUser && loggedUser.id === id) {
						reduxStore.dispatch(setUser({ status: STATUSES[status], statusText }));
					}
				}
			}));

			resolve();
		});
	},

	async shareExtensionInit(server) {
		database.setShareDB(server);

		if (this.shareSDK) {
			this.shareSDK.disconnect();
			this.shareSDK = null;
		}

		// Use useSsl: false only if server url starts with http://
		const useSsl = !/http:\/\//.test(server);

		this.shareSDK = new RocketchatClient({ host: server, protocol: 'ddp', useSsl });

		// set Server
		const serversDB = database.servers;
		reduxStore.dispatch(shareSelectServer(server));

		// set User info
		try {
			const userId = await RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ server }`);
			const userCollections = serversDB.collections.get('users');
			let user = null;
			if (userId) {
				const userRecord = await userCollections.find(userId);
				user = {
					id: userRecord.id,
					token: userRecord.token,
					username: userRecord.username,
					roles: userRecord.roles
				};
			}
			reduxStore.dispatch(shareSetUser(user));
			await RocketChat.login({ resume: user.token });
		} catch (e) {
			log(e);
		}
	},
	closeShareExtension() {
		if (this.shareSDK) {
			this.shareSDK.disconnect();
			this.shareSDK = null;
		}
		database.share = null;

		reduxStore.dispatch(shareSetUser(null));
	},

	updateJitsiTimeout(rid) {
		return this.methodCall('jitsi:updateTimeout', rid);
	},

	register(credentials) {
		// RC 0.50.0
		return this.post('users.register', credentials, false);
	},

	setUsername(username) {
		// RC 0.51.0
		return this.methodCall('setUsername', username);
	},

	forgotPassword(email) {
		// RC 0.64.0
		return this.post('users.forgotPassword', { email }, false);
	},

	loginTOTP(params) {
		return new Promise(async(resolve, reject) => {
			try {
				const result = await this.login(params);
				return resolve(result);
			} catch (e) {
				if (e.data?.error && (e.data.error === 'totp-required' || e.data.error === 'totp-invalid')) {
					const { details } = e.data;
					try {
						const code = await twoFactor({ method: details?.method || 'totp', invalid: e.data.error === 'totp-invalid' });
						return resolve(this.loginTOTP({ ...params, code: code?.twoFactorCode }));
					} catch {
						// twoFactor was canceled
						return reject();
					}
				} else {
					reject(e);
				}
			}
		});
	},

	loginWithPassword({ user, password }) {
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
				username: user,
				crowdPassword: password,
				crowd: true
			};
		}

		try {
			return this.loginTOTP(params);
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
			const sdk = this.shareSDK || this.sdk;
			// RC 0.64.0
			await sdk.login(params);
			const { result } = sdk.currentLogin;
			const user = {
				id: result.userId,
				token: result.authToken,
				username: result.me.username,
				name: result.me.name,
				language: result.me.language,
				status: result.me.status,
				statusText: result.me.statusText,
				customFields: result.me.customFields,
				emails: result.me.emails,
				roles: result.me.roles
			};
			return user;
		} catch (e) {
			throw e;
		}
	},
	async logout({ server }) {
		if (this.roomsSub) {
			this.roomsSub.stop();
			this.roomsSub = null;
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
			// clear certificate for server - SSL Pinning
			const certificate = await RNUserDefaults.objectForKey(extractHostname(server));
			if (certificate && certificate.path) {
				await RNUserDefaults.clear(extractHostname(server));
				await FileSystem.deleteAsync(certificate.path);
			}
		} catch (error) {
			console.log('logout_rn_user_defaults', error);
		}

		const userId = await RNUserDefaults.get(`${ TOKEN_KEY }-${ server }`);

		try {
			const serversDB = database.servers;
			await serversDB.action(async() => {
				const usersCollection = serversDB.collections.get('users');
				const userRecord = await usersCollection.find(userId);
				const serverCollection = serversDB.collections.get('servers');
				const serverRecord = await serverCollection.find(server);
				await serversDB.batch(
					userRecord.prepareDestroyPermanently(),
					serverRecord.prepareDestroyPermanently()
				);
			});
		} catch (error) {
			// Do nothing
		}

		await RNUserDefaults.clear('currentServer');
		await RNUserDefaults.clear(TOKEN_KEY);
		await RNUserDefaults.clear(`${ TOKEN_KEY }-${ server }`);
		await RNUserDefaults.clear(`${ BASIC_AUTH_KEY }-${ server }`);

		try {
			const db = database.active;
			await db.action(() => db.unsafeResetDatabase());
		} catch (error) {
			console.log(error);
		}
	},
	async clearCache({ server }) {
		try {
			const serversDB = database.servers;
			await serversDB.action(async() => {
				const serverCollection = serversDB.collections.get('servers');
				const serverRecord = await serverCollection.find(server);
				await serverRecord.update((s) => {
					s.roomsUpdatedAt = null;
				});
			});
		} catch (e) {
			// Do nothing
		}

		try {
			const db = database.active;
			await db.action(() => db.unsafeResetDatabase());
		} catch (e) {
			// Do nothing
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
					await this.post('push.token', data);
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
	sendMessage,
	getRooms,
	readMessages,
	async resendMessage(message, tmid) {
		const db = database.active;
		try {
			await db.action(async() => {
				await message.update((m) => {
					m.status = messagesStatus.TEMP;
				});
			});
			let m = {
				id: message.id,
				msg: message.msg,
				subscription: { id: message.subscription.id }
			};
			if (tmid) {
				m = {
					...m,
					tmid
				};
			}
			await sendMessageCall.call(this, m);
		} catch (e) {
			log(e);
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

		const db = database.active;
		let data = await db.collections.get('subscriptions').query(
			Q.where('name', Q.like(`%${ Q.sanitizeLikeString(searchText) }%`))
		).fetch();

		if (filterUsers && !filterRooms) {
			data = data.filter(item => item.t === 'd');
		} else if (!filterUsers && filterRooms) {
			data = data.filter(item => item.t !== 'd');
		}
		data = data.slice(0, 7);

		data = data.map((sub) => {
			if (sub.t !== 'd') {
				return ({
					rid: sub.rid,
					name: sub.name,
					fname: sub.fname,
					t: sub.t,
					search: true
				});
			}
			return sub;
		});

		const usernames = data.map(sub => sub.name);
		try {
			if (data.length < 7) {
				const { users, rooms } = await Promise.race([
					RocketChat.spotlight(searchText, usernames, { users: filterUsers, rooms: filterRooms }),
					new Promise((resolve, reject) => this.oldPromise = reject)
				]);
				if (filterUsers) {
					data = data.concat(users.map(user => ({
						...user,
						rid: user.username,
						name: user.username,
						t: 'd',
						search: true
					})));
				}
				if (filterRooms) {
					rooms.forEach((room) => {
						// Check if it exists on local database
						const index = data.findIndex(item => item.rid === room._id);
						if (index === -1) {
							data.push({
								rid: room._id,
								...room,
								search: true
							});
						}
					});
				}
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
		return this.methodCall('spotlight', search, usernames, type);
	},

	createDirectMessage(username) {
		// RC 0.59.0
		return this.post('im.create', { username });
	},

	createGroupChat() {
		const { users } = reduxStore.getState().selectedUsers;
		const usernames = users.map(u => u.name).join(',');

		// RC 3.1.0
		return this.post('im.create', { usernames });
	},

	createDiscussion({
		prid, pmid, t_name, reply, users
	}) {
		// RC 1.0.0
		return this.post('rooms.createDiscussion', {
			prid, pmid, t_name, reply, users
		});
	},

	joinRoom(roomId, type) {
		// TODO: join code
		// RC 0.48.0
		if (type === 'p') {
			return this.methodCall('joinRoom', roomId);
		}
		return this.post('channels.join', { roomId });
	},
	triggerBlockAction,
	triggerSubmitView,
	triggerCancel,
	sendFileMessage,
	cancelUpload,
	isUploadActive,
	getSettings,
	getLoginSettings,
	setSettings,
	getPermissions,
	getCustomEmojis,
	setCustomEmojis,
	getSlashCommands,
	getRoles,
	parseSettings: settings => settings.reduce((ret, item) => {
		ret[item._id] = defaultSettings[item._id] && item[defaultSettings[item._id].type];
		if (item._id === 'Hide_System_Messages') {
			ret[item._id] = ret[item._id]
				.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []);
		}
		return ret;
	}, {}),
	_prepareSettings(settings) {
		return settings.map((setting) => {
			setting[defaultSettings[setting._id].type] = setting.value;
			return setting;
		});
	},
	deleteMessage(messageId, rid) {
		// RC 0.48.0
		return this.post('chat.delete', { msgId: messageId, roomId: rid });
	},
	editMessage(message) {
		const { id, msg, rid } = message;
		// RC 0.49.0
		return this.post('chat.update', { roomId: rid, msgId: id, text: msg });
	},
	markAsUnread({ messageId }) {
		return this.post('subscriptions.unread', { firstUnreadMessage: { _id: messageId } });
	},
	toggleStarMessage(messageId, starred) {
		if (starred) {
			// RC 0.59.0
			return this.post('chat.unStarMessage', { messageId });
		}
		// RC 0.59.0
		return this.post('chat.starMessage', { messageId });
	},
	togglePinMessage(messageId, pinned) {
		if (pinned) {
			// RC 0.59.0
			return this.post('chat.unPinMessage', { messageId });
		}
		// RC 0.59.0
		return this.post('chat.pinMessage', { messageId });
	},
	reportMessage(messageId) {
		return this.post('chat.reportMessage', { messageId, description: 'Message reported by user' });
	},
	async getRoom(rid) {
		try {
			const db = database.active;
			const room = await db.collections.get('subscriptions').find(rid);
			return Promise.resolve(room);
		} catch (error) {
			return Promise.reject(new Error('Room not found'));
		}
	},
	async getPermalinkMessage(message) {
		let room;
		try {
			room = await RocketChat.getRoom(message.subscription.id);
		} catch (e) {
			log(e);
			return null;
		}
		const { server } = reduxStore.getState().server;
		const roomType = {
			p: 'group',
			c: 'channel',
			d: 'direct'
		}[room.t];
		return `${ server }/${ roomType }/${ room.name }?msg=${ message.id }`;
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
	subscribeRoom(...args) {
		return this.sdk.subscribeRoom(...args);
	},
	unsubscribe(subscription) {
		return this.sdk.unsubscribe(subscription);
	},
	onStreamData(...args) {
		return this.sdk.onStreamData(...args);
	},
	emitTyping(room, t = true) {
		const { login } = reduxStore.getState();
		return this.methodCall('stream-notify-room', `${ room }/typing`, login.user.username, t);
	},
	setUserPresenceAway() {
		return this.methodCall('UserPresence:away');
	},
	setUserPresenceOnline() {
		return this.methodCall('UserPresence:online');
	},
	setUserStatus(status, message) {
		// RC 1.2.0
		return this.post('users.setStatus', { status, message });
	},
	setReaction(emoji, messageId) {
		// RC 0.62.2
		return this.post('chat.react', { emoji, messageId });
	},
	toggleFavorite(roomId, favorite) {
		// RC 0.64.0
		return this.post('rooms.favorite', { roomId, favorite });
	},
	toggleRead(read, roomId) {
		if (read) {
			return this.post('subscriptions.unread', { roomId });
		}
		return this.post('subscriptions.read', { rid: roomId });
	},
	getRoomMembers(rid, allUsers, skip = 0, limit = 10) {
		// RC 0.42.0
		return this.methodCall('getUsersOfRoom', rid, allUsers, { skip, limit });
	},
	getUserRoles() {
		// RC 0.27.0
		return this.methodCall('getUserRoles');
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

	getUidDirectMessage(room) {
		const { id: userId } = reduxStore.getState().login.user;

		// legacy method
		if (!room.uids && room.rid && room.t === 'd') {
			return room.rid.replace(userId, '').trim();
		}

		if (RocketChat.isGroupChat(room)) {
			return false;
		}

		const me = room && room.uids && room.uids.find(uid => uid === userId);
		const other = room && room.uids && room.uids.filter(uid => uid !== userId);

		return other && other.length ? other[0] : me;
	},

	isGroupChat(room) {
		return (room.uids && room.uids.length > 2) || (room.usernames && room.usernames.length > 2);
	},

	toggleBlockUser(rid, blocked, block) {
		if (block) {
			// RC 0.49.0
			return this.methodCall('blockUser', { rid, blocked });
		}
		// RC 0.49.0
		return this.methodCall('unblockUser', { rid, blocked });
	},
	leaveRoom(roomId, t) {
		// RC 0.48.0
		return this.post(`${ this.roomTypeToApiType(t) }.leave`, { roomId });
	},
	deleteRoom(roomId, t) {
		// RC 0.49.0
		return this.post(`${ this.roomTypeToApiType(t) }.delete`, { roomId });
	},
	toggleMuteUserInRoom(rid, username, mute) {
		if (mute) {
			// RC 0.51.0
			return this.methodCall('muteUserInRoom', { rid, username });
		}
		// RC 0.51.0
		return this.methodCall('unmuteUserInRoom', { rid, username });
	},
	toggleArchiveRoom(roomId, t, archive) {
		if (archive) {
			// RC 0.48.0
			return this.post(`${ this.roomTypeToApiType(t) }.archive`, { roomId });
		}
		// RC 0.48.0
		return this.post(`${ this.roomTypeToApiType(t) }.unarchive`, { roomId });
	},
	hideRoom(roomId, t) {
		return this.post(`${ this.roomTypeToApiType(t) }.close`, { roomId });
	},
	saveRoomSettings(rid, params) {
		// RC 0.55.0
		return this.methodCall('saveRoomSettings', rid, params);
	},
	post(...args) {
		return new Promise(async(resolve, reject) => {
			try {
				const result = await this.sdk.post(...args);
				return resolve(result);
			} catch (e) {
				if (e.data && (e.data.errorType === 'totp-required' || e.data.errorType === 'totp-invalid')) {
					const { details } = e.data;
					try {
						await twoFactor({ method: details?.method, invalid: e.data.errorType === 'totp-invalid' });
						return resolve(this.post(...args));
					} catch {
						// twoFactor was canceled
						return resolve({});
					}
				} else {
					reject(e);
				}
			}
		});
	},
	methodCall(...args) {
		return new Promise(async(resolve, reject) => {
			try {
				const result = await this.sdk.methodCall(...args, this.code);
				return resolve(result);
			} catch (e) {
				if (e.error && (e.error === 'totp-required' || e.error === 'totp-invalid')) {
					const { details } = e;
					try {
						this.code = await twoFactor({ method: details?.method, invalid: e.error === 'totp-invalid' });
						return resolve(this.methodCall(...args));
					} catch {
						// twoFactor was canceled
						return resolve({});
					}
				} else {
					reject(e);
				}
			}
		});
	},
	sendEmailCode() {
		const { username } = reduxStore.getState().login.user;
		// RC 3.1.0
		return this.post('users.2fa.sendEmailCode', { emailOrUsername: username });
	},
	saveUserProfile(data, customFields) {
		// RC 0.62.2
		return this.post('users.updateOwnBasicInfo', { data, customFields });
	},
	saveUserPreferences(params) {
		// RC 0.51.0
		return this.methodCall('saveUserPreferences', params);
	},
	saveNotificationSettings(roomId, notifications) {
		// RC 0.63.0
		return this.post('rooms.saveNotification', { roomId, notifications });
	},
	addUsersToRoom(rid) {
		let { users } = reduxStore.getState().selectedUsers;
		users = users.map(u => u.name);
		// RC 0.51.0
		return this.methodCall('addUsersToRoom', { rid, users });
	},
	getSingleMessage(msgId) {
		// RC 0.57.0
		return this.methodCall('getSingleMessage', msgId);
	},
	async hasPermission(permissions, rid) {
		const db = database.active;
		const subsCollection = db.collections.get('subscriptions');
		const permissionsCollection = db.collections.get('permissions');
		let roomRoles = [];
		try {
			// get the room from database
			const room = await subsCollection.find(rid);
			// get room roles
			roomRoles = room.roles || [];
		} catch (error) {
			console.log('hasPermission -> Room not found');
			return permissions.reduce((result, permission) => {
				result[permission] = false;
				return result;
			}, {});
		}
		// get permissions from database
		try {
			const permissionsFiltered = await permissionsCollection.query(Q.where('id', Q.oneOf(permissions))).fetch();
			const shareUser = reduxStore.getState().share.user;
			const loginUser = reduxStore.getState().login.user;
			// get user roles on the server from redux
			const userRoles = (shareUser.roles || loginUser.roles) || [];
			// merge both roles
			const mergedRoles = [...new Set([...roomRoles, ...userRoles])];

			// return permissions in object format
			// e.g. { 'edit-room': true, 'set-readonly': false }
			return permissions.reduce((result, permission) => {
				result[permission] = false;
				const permissionFound = permissionsFiltered.find(p => p.id === permission);
				if (permissionFound) {
					result[permission] = returnAnArray(permissionFound.roles).some(r => mergedRoles.includes(r));
				}
				return result;
			}, {});
		} catch (e) {
			log(e);
		}
	},
	getAvatarSuggestion() {
		// RC 0.51.0
		return this.methodCall('getAvatarSuggestion');
	},
	resetAvatar(userId) {
		// RC 0.55.0
		return this.post('users.resetAvatar', { userId });
	},
	setAvatarFromService({ data, contentType = '', service = null }) {
		// RC 0.51.0
		return this.methodCall('setAvatarFromService', data, contentType, service);
	},
	async getAllowCrashReport() {
		const allowCrashReport = await AsyncStorage.getItem(CRASH_REPORT_KEY);
		if (allowCrashReport === null) {
			return true;
		}
		return JSON.parse(allowCrashReport);
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

			if (loginServicesResult.success && loginServicesResult.services) {
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
			} else {
				reduxStore.dispatch(setLoginServices({}));
			}
		} catch (error) {
			console.log(error);
			reduxStore.dispatch(setLoginServices({}));
		}
	},
	_determineAuthType(services) {
		const {
			name, custom, showButton = true, service
		} = services;

		const authName = name || service;

		if (custom && showButton) {
			return 'oauth_custom';
		}

		if (service === 'saml') {
			return 'saml';
		}

		if (service === 'cas') {
			return 'cas';
		}

		// TODO: remove this after other oauth providers are implemented. e.g. Drupal, github_enterprise
		const availableOAuth = ['facebook', 'github', 'gitlab', 'google', 'linkedin', 'meteor-developer', 'twitter', 'wordpress'];
		return availableOAuth.includes(authName) ? 'oauth' : 'not_supported';
	},
	getUsernameSuggestion() {
		// RC 0.65.0
		return this.sdk.get('users.getUsernameSuggestion');
	},
	roomTypeToApiType(t) {
		const types = {
			c: 'channels', d: 'im', p: 'groups', l: 'channels'
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
			return this.post('chat.followMessage', { mid });
		}
		return this.post('chat.unfollowMessage', { mid });
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
	runSlashCommand(command, roomId, params, triggerId, tmid) {
		// RC 0.60.2
		return this.post('commands.run', {
			command, roomId, params, triggerId, tmid
		});
	},
	getCommandPreview(command, roomId, params) {
		// RC 0.65.0
		return this.sdk.get('commands.preview', {
			command, roomId, params
		});
	},
	executeCommandPreview(command, params, roomId, previewItem, triggerId, tmid) {
		// RC 0.65.0
		return this.post('commands.preview', {
			command, params, roomId, previewItem, triggerId, tmid
		});
	},
	_setUser(ddpMessage) {
		this.activeUsers = this.activeUsers || {};
		const { user } = reduxStore.getState().login;

		if (ddpMessage.fields && user && user.id === ddpMessage.id) {
			reduxStore.dispatch(setUser(ddpMessage.fields));
		}

		if (ddpMessage.cleared && user && user.id === ddpMessage.id) {
			reduxStore.dispatch(setUser({ status: { status: 'offline' } }));
		}

		if (!this._setUserTimer) {
			this._setUserTimer = setTimeout(() => {
				const activeUsersBatch = this.activeUsers;
				InteractionManager.runAfterInteractions(() => {
					reduxStore.dispatch(setActiveUsers(activeUsersBatch));
				});
				this._setUserTimer = null;
				return this.activeUsers = {};
			}, 10000);
		}

		if (!ddpMessage.fields) {
			this.activeUsers[ddpMessage.id] = { status: 'offline' };
		} else if (ddpMessage.fields.status) {
			this.activeUsers[ddpMessage.id] = { status: ddpMessage.fields.status };
		}
	},
	getUsersPresence,
	getUserPresence,
	subscribeUsersPresence,
	getDirectory({
		query, count, offset, sort
	}) {
		// RC 1.0
		return this.sdk.get('directory', {
			query, count, offset, sort
		});
	},
	async canAutoTranslate() {
		const db = database.active;
		try {
			const AutoTranslate_Enabled = reduxStore.getState().settings && reduxStore.getState().settings.AutoTranslate_Enabled;
			if (!AutoTranslate_Enabled) {
				return false;
			}
			const permissionsCollection = db.collections.get('permissions');
			const autoTranslatePermission = await permissionsCollection.find('auto-translate');
			const userRoles = (reduxStore.getState().login.user && reduxStore.getState().login.user.roles) || [];
			return autoTranslatePermission.roles.some(role => userRoles.includes(role));
		} catch (e) {
			log(e);
			return false;
		}
	},
	saveAutoTranslate({
		rid, field, value, options
	}) {
		return this.methodCall('autoTranslate.saveSettings', rid, field, value, options);
	},
	getSupportedLanguagesAutoTranslate() {
		return this.methodCall('autoTranslate.getSupportedLanguages', 'en');
	},
	translateMessage(message, targetLanguage) {
		return this.methodCall('autoTranslate.translateMessage', message, targetLanguage);
	},
	getRoomTitle(room) {
		const { UI_Use_Real_Name: useRealName } = reduxStore.getState().settings;
		const { username } = reduxStore.getState().login.user;
		if (RocketChat.isGroupChat(room) && !(room.name && room.name.length)) {
			return room.usernames.filter(u => u !== username).sort((u1, u2) => u1.localeCompare(u2)).join(', ');
		}
		return ((room.prid || useRealName) && room.fname) || room.name;
	},
	getRoomAvatar(room) {
		if (RocketChat.isGroupChat(room)) {
			return room.uids.length + room.usernames.join();
		}
		return room.prid ? room.fname : room.name;
	},

	findOrCreateInvite({ rid, days, maxUses }) {
		// RC 2.4.0
		return this.post('findOrCreateInvite', { rid, days, maxUses });
	},
	validateInviteToken(token) {
		// RC 2.4.0
		return this.post('validateInviteToken', { token });
	},
	useInviteToken(token) {
		// RC 2.4.0
		return this.post('useInviteToken', { token });
	}
};

export default RocketChat;

import { InteractionManager } from 'react-native';
import semver from 'semver';
import {
	Rocketchat as RocketchatClient,
	settings as RocketChatSettings
} from '@rocket.chat/sdk';
import { Q } from '@nozbe/watermelondb';
import AsyncStorage from '@react-native-community/async-storage';
import RNFetchBlob from 'rn-fetch-blob';

import reduxStore from './createStore';
import defaultSettings from '../constants/settings';
import database from './database';
import log from '../utils/log';
import { isIOS, getBundleId } from '../utils/deviceInfo';
import fetch from '../utils/fetch';

import { encryptionInit } from '../actions/encryption';
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
import {
	getEnterpriseModules, setEnterpriseModules, hasLicense, isOmnichannelModuleAvailable
} from './methods/enterpriseModules';
import getSlashCommands from './methods/getSlashCommands';
import getRoles from './methods/getRoles';
import canOpenRoom from './methods/canOpenRoom';
import triggerBlockAction, { triggerSubmitView, triggerCancel } from './methods/actions';

import loadMessagesForRoom from './methods/loadMessagesForRoom';
import loadMissedMessages from './methods/loadMissedMessages';
import loadThreadMessages from './methods/loadThreadMessages';

import sendMessage, { resendMessage } from './methods/sendMessage';
import { sendFileMessage, cancelUpload, isUploadActive } from './methods/sendFileMessage';

import callJitsi from './methods/callJitsi';
import logout, { removeServer } from './methods/logout';

import { getDeviceToken } from '../notifications/push';
import { setActiveUsers } from '../actions/activeUsers';
import I18n from '../i18n';
import { twoFactor } from '../utils/twoFactor';
import { selectServerFailure } from '../actions/server';
import { useSsl } from '../utils/url';
import UserPreferences from './userPreferences';
import { Encryption } from './encryption';
import EventEmitter from '../utils/events';
import { sanitizeLikeString } from './database/utils';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const CURRENT_SERVER = 'currentServer';
const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';
export const THEME_PREFERENCES_KEY = 'RC_THEME_PREFERENCES_KEY';
export const CRASH_REPORT_KEY = 'RC_CRASH_REPORT_KEY';
export const ANALYTICS_EVENTS_KEY = 'RC_ANALYTICS_EVENTS_KEY';
const returnAnArray = obj => obj || [];
const MIN_ROCKETCHAT_VERSION = '0.70.0';

const STATUSES = ['offline', 'online', 'away', 'busy'];

const RocketChat = {
	TOKEN_KEY,
	CURRENT_SERVER,
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
		name, users, type, readOnly, broadcast, encrypted
	}) {
		// RC 0.51.0
		return this.methodCallWrapper(type ? 'createPrivateGroup' : 'createChannel', name, users, readOnly, {}, { broadcast, encrypted });
	},
	async getWebsocketInfo({ server }) {
		const sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: useSsl(server) });

		try {
			await sdk.connect();
		} catch (err) {
			if (err.message && err.message.includes('400')) {
				return {
					success: false,
					message: I18n.t('Websocket_disabled', { contact: I18n.t('Contact_your_server_admin') })
				};
			}
		}

		sdk.disconnect();

		return {
			success: true
		};
	},
	async getServerInfo(server) {
		try {
			const response = await RNFetchBlob.fetch('GET', `${ server }/api/info`, { ...RocketChatSettings.customHeaders });
			try {
				// Try to resolve as json
				const jsonRes = response.json();
				if (!(jsonRes?.success)) {
					return {
						success: false,
						message: I18n.t('Not_RC_Server', { contact: I18n.t('Contact_your_server_admin') })
					};
				}
				if (semver.lt(jsonRes.version, MIN_ROCKETCHAT_VERSION)) {
					return {
						success: false,
						message: I18n.t('Invalid_server_version', {
							currentVersion: jsonRes.version,
							minVersion: MIN_ROCKETCHAT_VERSION
						})
					};
				}
				return jsonRes;
			} catch (error) {
				// Request is successful, but response isn't a json
			}
		} catch (e) {
			if (e?.message) {
				if (e.message === 'Aborted') {
					reduxStore.dispatch(selectServerFailure());
					throw e;
				}
				return {
					success: false,
					message: e.message
				};
			}
		}

		return {
			success: false,
			message: I18n.t('Not_RC_Server', { contact: I18n.t('Contact_your_server_admin') })
		};
	},
	stopListener(listener) {
		return listener && listener.stop();
	},
	// Abort all requests and create a new AbortController
	abort() {
		if (this.controller) {
			this.controller.abort();
			if (this.sdk) {
				this.sdk.abort();
			}
		}
		this.controller = new AbortController();
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

			EventEmitter.emit('INQUIRY_UNSUBSCRIBE');

			if (this.sdk) {
				this.sdk.disconnect();
				this.sdk = null;
			}

			if (this.code) {
				this.code = null;
			}

			this.sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: useSsl(server) });
			this.getSettings();

			const sdkConnect = () => this.sdk.connect()
				.then(() => {
					const { server: currentServer } = reduxStore.getState().server;
					if (user && user.token && server === currentServer) {
						reduxStore.dispatch(loginRequest({ resume: user.token }, logoutOnError));
					}
				})
				.catch((err) => {
					console.log('connect error', err);

					// when `connect` raises an error, we try again in 10 seconds
					this.connectTimeout = setTimeout(() => {
						if (this.sdk?.client?.host === server) {
							sdkConnect();
						}
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

		this.shareSDK = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: useSsl(server) });

		// set Server
		const serversDB = database.servers;
		reduxStore.dispatch(shareSelectServer(server));

		RocketChat.setCustomEmojis();

		// set User info
		try {
			const userId = await UserPreferences.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ server }`);
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
			reduxStore.dispatch(encryptionInit());
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

		reduxStore.dispatch(shareSetUser({}));
	},

	async e2eFetchMyKeys() {
		// RC 0.70.0
		const sdk = this.shareSDK || this.sdk;
		const result = await sdk.get('e2e.fetchMyKeys');
		// snake_case -> camelCase
		if (result.success) {
			return {
				success: result.success,
				publicKey: result.public_key,
				privateKey: result.private_key
			};
		}
		return result;
	},
	e2eSetUserPublicAndPrivateKeys(public_key, private_key) {
		// RC 2.2.0
		return this.post('e2e.setUserPublicAndPrivateKeys', { public_key, private_key });
	},
	e2eRequestSubscriptionKeys() {
		// RC 0.72.0
		return this.methodCallWrapper('e2e.requestSubscriptionKeys');
	},
	e2eGetUsersOfRoomWithoutKey(rid) {
		// RC 0.70.0
		return this.sdk.get('e2e.getUsersOfRoomWithoutKey', { rid });
	},
	e2eSetRoomKeyID(rid, keyID) {
		// RC 0.70.0
		return this.post('e2e.setRoomKeyID', { rid, keyID });
	},
	e2eUpdateGroupKey(uid, rid, key) {
		// RC 0.70.0
		return this.post('e2e.updateGroupKey', { uid, rid, key });
	},
	e2eRequestRoomKey(rid, e2eKeyId) {
		// RC 0.70.0
		return this.methodCallWrapper('stream-notify-room-users', `${ rid }/e2ekeyRequest`, rid, e2eKeyId);
	},

	updateJitsiTimeout(roomId) {
		// RC 0.74.0
		return this.post('video-conference/jitsi.update-timeout', { roomId });
	},

	register(credentials) {
		// RC 0.50.0
		return this.post('users.register', credentials, false);
	},

	forgotPassword(email) {
		// RC 0.64.0
		return this.post('users.forgotPassword', { email }, false);
	},

	loginTOTP(params, loginEmailPassword) {
		return new Promise(async(resolve, reject) => {
			try {
				const result = await this.login(params, loginEmailPassword);
				return resolve(result);
			} catch (e) {
				if (e.data?.error && (e.data.error === 'totp-required' || e.data.error === 'totp-invalid')) {
					const { details } = e.data;
					try {
						reduxStore.dispatch(setUser({ username: params.user || params.username }));
						const code = await twoFactor({ method: details?.method || 'totp', invalid: e.data.error === 'totp-invalid' });
						return resolve(this.loginTOTP({ ...params, code: code?.twoFactorCode }, loginEmailPassword));
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

		return this.loginTOTP(params, true);
	},

	async loginOAuthOrSso(params) {
		const result = await this.login(params);
		reduxStore.dispatch(loginRequest({ resume: result.token }));
	},

	async login(params, loginEmailPassword) {
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
			statusLivechat: result.me.statusLivechat,
			emails: result.me.emails,
			roles: result.me.roles,
			loginEmailPassword
		};
		return user;
	},
	logout,
	logoutOtherLocations() {
		const { id: userId } = reduxStore.getState().login.user;
		return this.sdk.post('users.removeOtherTokens', { userId });
	},
	removeServer,
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
	resendMessage,

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
		const likeString = sanitizeLikeString(searchText);
		let data = await db.collections.get('subscriptions').query(
			Q.or(
				Q.where('name', Q.like(`%${ likeString }%`)),
				Q.where('fname', Q.like(`%${ likeString }%`))
			)
		).fetch();

		if (filterUsers && !filterRooms) {
			data = data.filter(item => item.t === 'd' && !RocketChat.isGroupChat(item));
		} else if (!filterUsers && filterRooms) {
			data = data.filter(item => item.t !== 'd' || RocketChat.isGroupChat(item));
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
		return this.methodCallWrapper('spotlight', search, usernames, type);
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
			return this.methodCallWrapper('joinRoom', roomId);
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
	getEnterpriseModules,
	setEnterpriseModules,
	hasLicense,
	isOmnichannelModuleAvailable,
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
	async editMessage(message) {
		const { rid, msg } = await Encryption.encryptMessage(message);
		// RC 0.49.0
		return this.post('chat.update', { roomId: rid, msgId: message.id, text: msg });
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
		return `${ server }/${ roomType }/${ this.isGroupChat(room) ? room.rid : room.name }?msg=${ message.id }`;
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
	emitTyping(room, typing = true) {
		const { login, settings } = reduxStore.getState();
		const { UI_Use_Real_Name } = settings;
		const { user } = login;
		const name = UI_Use_Real_Name ? user.name : user.username;
		return this.methodCall('stream-notify-room', `${ room }/typing`, name, typing);
	},
	setUserPresenceAway() {
		return this.methodCall('UserPresence:away');
	},
	setUserPresenceOnline() {
		return this.methodCall('UserPresence:online');
	},
	setUserPreferences(userId, data) {
		// RC 0.62.0
		return this.sdk.post('users.setPreferences', { userId, data });
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
		return this.methodCallWrapper('getUsersOfRoom', rid, allUsers, { skip, limit });
	},

	methodCallWrapper(method, ...params) {
		const { API_Use_REST_For_DDP_Calls } = reduxStore.getState().settings;
		if (API_Use_REST_For_DDP_Calls) {
			return new Promise(async(resolve, reject) => {
				const data = await this.post(`method.call/${ method }`, { message: JSON.stringify({ method, params }) });
				const response = JSON.parse(data.message);
				if (response?.error) {
					return reject(response.error);
				}
				return resolve(response.result);
			});
		}
		return this.methodCall(method, ...params);
	},

	getUserRoles() {
		// RC 0.27.0
		return this.methodCallWrapper('getUserRoles');
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
	getUserPreferences(userId) {
		// RC 0.62.0
		return this.sdk.get('users.getPreferences', { userId });
	},
	getRoomInfo(roomId) {
		// RC 0.72.0
		return this.sdk.get('rooms.info', { roomId });
	},

	getVisitorInfo(visitorId) {
		// RC 2.3.0
		return this.sdk.get('livechat/visitors.info', { visitorId });
	},
	closeLivechat(rid, comment) {
		// RC 0.29.0
		return this.methodCallWrapper('livechat:closeRoom', rid, comment, { clientAction: true });
	},
	editLivechat(userData, roomData) {
		// RC 0.55.0
		return this.methodCallWrapper('livechat:saveInfo', userData, roomData);
	},
	returnLivechat(rid) {
		// RC 0.72.0
		return this.methodCallWrapper('livechat:returnAsInquiry', rid);
	},
	forwardLivechat(transferData) {
		// RC 0.36.0
		return this.methodCallWrapper('livechat:transfer', transferData);
	},
	getPagesLivechat(rid, offset) {
		// RC 2.3.0
		return this.sdk.get(`livechat/visitors.pagesVisited/${ rid }?count=50&offset=${ offset }`);
	},
	getDepartmentInfo(departmentId) {
		// RC 2.2.0
		return this.sdk.get(`livechat/department/${ departmentId }?includeAgents=false`);
	},
	getDepartments() {
		// RC 2.2.0
		return this.sdk.get('livechat/department');
	},
	usersAutoComplete(selector) {
		// RC 2.4.0
		return this.sdk.get('users.autocomplete', { selector });
	},
	getRoutingConfig() {
		// RC 2.0.0
		return this.methodCallWrapper('livechat:getRoutingConfig');
	},
	getTagsList() {
		// RC 2.0.0
		return this.methodCallWrapper('livechat:getTagsList');
	},
	getAgentDepartments(uid) {
		// RC 2.4.0
		return this.sdk.get(`livechat/agents/${ uid }/departments?enabledDepartmentsOnly=true`);
	},
	getCustomFields() {
		// RC 2.2.0
		return this.sdk.get('livechat/custom-fields');
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

	isRead(item) {
		let isUnread = item.archived !== true && item.open === true; // item is not archived and not opened
		isUnread = isUnread && (item.unread > 0 || item.alert === true); // either its unread count > 0 or its alert
		return !isUnread;
	},

	isGroupChat(room) {
		return (room.uids && room.uids.length > 2) || (room.usernames && room.usernames.length > 2);
	},

	toggleBlockUser(rid, blocked, block) {
		if (block) {
			// RC 0.49.0
			return this.methodCallWrapper('blockUser', { rid, blocked });
		}
		// RC 0.49.0
		return this.methodCallWrapper('unblockUser', { rid, blocked });
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
			return this.methodCallWrapper('muteUserInRoom', { rid, username });
		}
		// RC 0.51.0
		return this.methodCallWrapper('unmuteUserInRoom', { rid, username });
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
		return this.methodCallWrapper('saveRoomSettings', rid, params);
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
				const result = await this.sdk.methodCall(...args, this.code || '');
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
	saveUserPreferences(data) {
		// RC 0.62.0
		return this.post('users.setPreferences', { data });
	},
	saveNotificationSettings(roomId, notifications) {
		// RC 0.63.0
		return this.post('rooms.saveNotification', { roomId, notifications });
	},
	addUsersToRoom(rid) {
		let { users } = reduxStore.getState().selectedUsers;
		users = users.map(u => u.name);
		// RC 0.51.0
		return this.methodCallWrapper('addUsersToRoom', { rid, users });
	},
	getSingleMessage(msgId) {
		// RC 0.47.0
		return this.sdk.get('chat.getMessage', { msgId });
	},
	hasRole(role) {
		const shareUser = reduxStore.getState().share.user;
		const loginUser = reduxStore.getState().login.user;
		// get user roles on the server from redux
		const userRoles = (shareUser?.roles || loginUser?.roles) || [];

		return userRoles.indexOf(r => r === role) > -1;
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
			const userRoles = (shareUser?.roles || loginUser?.roles) || [];
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
		return this.methodCallWrapper('getAvatarSuggestion');
	},
	resetAvatar(userId) {
		// RC 0.55.0
		return this.post('users.resetAvatar', { userId });
	},
	setAvatarFromService({ data, contentType = '', service = null }) {
		// RC 0.51.0
		return this.methodCallWrapper('setAvatarFromService', data, contentType, service);
	},
	async getAllowCrashReport() {
		const allowCrashReport = await AsyncStorage.getItem(CRASH_REPORT_KEY);
		if (allowCrashReport === null) {
			return true;
		}
		return JSON.parse(allowCrashReport);
	},
	async getAllowAnalyticsEvents() {
		const allowAnalyticsEvents = await AsyncStorage.getItem(ANALYTICS_EVENTS_KEY);
		if (allowAnalyticsEvents === null) {
			return true;
		}
		return JSON.parse(allowAnalyticsEvents);
	},
	async getSortPreferences() {
		const prefs = await UserPreferences.getMapAsync(SORT_PREFS_KEY);
		return prefs;
	},
	async saveSortPreference(param) {
		let prefs = await RocketChat.getSortPreferences();
		prefs = { ...prefs, ...param };
		return UserPreferences.setMapAsync(SORT_PREFS_KEY, prefs);
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

		if (authName === 'apple' && isIOS) {
			return 'apple';
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
	readThreads(tmid) {
		const serverVersion = reduxStore.getState().server.version;
		if (serverVersion && semver.gte(semver.coerce(serverVersion), '3.4.0')) {
			// RC 3.4.0
			return this.methodCallWrapper('readThreads', tmid);
		}
		return Promise.resolve();
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
		return this.methodCallWrapper('autoTranslate.saveSettings', rid, field, value, options);
	},
	getSupportedLanguagesAutoTranslate() {
		return this.methodCallWrapper('autoTranslate.getSupportedLanguages', 'en');
	},
	translateMessage(message, targetLanguage) {
		return this.methodCallWrapper('autoTranslate.translateMessage', message, targetLanguage);
	},
	getSenderName(sender) {
		const { UI_Use_Real_Name: useRealName } = reduxStore.getState().settings;
		return useRealName ? sender.name : sender.username;
	},
	getRoomTitle(room) {
		const { UI_Use_Real_Name: useRealName, UI_Allow_room_names_with_special_chars: allowSpecialChars } = reduxStore.getState().settings;
		const { username } = reduxStore.getState().login.user;
		if (RocketChat.isGroupChat(room) && !(room.name && room.name.length)) {
			return room.usernames.filter(u => u !== username).sort((u1, u2) => u1.localeCompare(u2)).join(', ');
		}
		if (allowSpecialChars && room.t !== 'd') {
			return room.fname || room.name;
		}
		return ((room.prid || useRealName) && room.fname) || room.name;
	},
	getRoomAvatar(room) {
		if (RocketChat.isGroupChat(room)) {
			return room.uids?.length + room.usernames?.join();
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

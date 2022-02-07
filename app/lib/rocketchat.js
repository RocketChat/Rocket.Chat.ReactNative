import { InteractionManager } from 'react-native';
import EJSON from 'ejson';
import { settings as RocketChatSettings, Rocketchat as RocketchatClient } from '@rocket.chat/sdk';
import { Q } from '@nozbe/watermelondb';
import AsyncStorage from '@react-native-community/async-storage';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import RNFetchBlob from 'rn-fetch-blob';
import isEmpty from 'lodash/isEmpty';

import defaultSettings from '../constants/settings';
import log from '../utils/log';
import { getBundleId, isIOS } from '../utils/deviceInfo';
import fetch from '../utils/fetch';
import SSLPinning from '../utils/sslPinning';
import { encryptionInit } from '../actions/encryption';
import { loginRequest, setLoginServices, setUser } from '../actions/login';
import { connectRequest, connectSuccess, disconnect } from '../actions/connect';
import { shareSelectServer, shareSetSettings, shareSetUser } from '../actions/share';
import { getDeviceToken } from '../notifications/push';
import { setActiveUsers } from '../actions/activeUsers';
import I18n from '../i18n';
import { twoFactor } from '../utils/twoFactor';
import { selectServerFailure } from '../actions/server';
import { useSsl } from '../utils/url';
import EventEmitter from '../utils/events';
import { updatePermission } from '../actions/permissions';
import { TEAM_TYPE } from '../definitions/ITeam';
import { updateSettings } from '../actions/settings';
import { compareServerVersion } from './utils';
import reduxStore from './createStore';
import database from './database';
import subscribeRooms from './methods/subscriptions/rooms';
import { getUserPresence, subscribeUsersPresence } from './methods/getUsersPresence';
import protectedFunction from './methods/helpers/protectedFunction';
import readMessages from './methods/readMessages';
import getSettings, { getLoginSettings, setSettings, subscribeSettings } from './methods/getSettings';
import getRooms from './methods/getRooms';
import { getPermissions, setPermissions } from './methods/getPermissions';
import { getCustomEmojis, setCustomEmojis } from './methods/getCustomEmojis';
import {
	getEnterpriseModules,
	hasLicense,
	isOmnichannelModuleAvailable,
	setEnterpriseModules
} from './methods/enterpriseModules';
import getSlashCommands from './methods/getSlashCommands';
import { getRoles, onRolesChanged, setRoles } from './methods/getRoles';
import canOpenRoom from './methods/canOpenRoom';
import triggerBlockAction, { triggerCancel, triggerSubmitView } from './methods/actions';
import loadMessagesForRoom from './methods/loadMessagesForRoom';
import loadSurroundingMessages from './methods/loadSurroundingMessages';
import loadNextMessages from './methods/loadNextMessages';
import loadMissedMessages from './methods/loadMissedMessages';
import loadThreadMessages from './methods/loadThreadMessages';
import sendMessage, { resendMessage } from './methods/sendMessage';
import { cancelUpload, isUploadActive, sendFileMessage } from './methods/sendFileMessage';
import callJitsi, { callJitsiWithoutServer } from './methods/callJitsi';
import logout, { removeServer } from './methods/logout';
import UserPreferences from './userPreferences';
import { Encryption } from './encryption';
import { sanitizeLikeString } from './database/utils';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const CURRENT_SERVER = 'currentServer';
const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';
const CERTIFICATE_KEY = 'RC_CERTIFICATE_KEY';
export const THEME_PREFERENCES_KEY = 'RC_THEME_PREFERENCES_KEY';
export const CRASH_REPORT_KEY = 'RC_CRASH_REPORT_KEY';
export const ANALYTICS_EVENTS_KEY = 'RC_ANALYTICS_EVENTS_KEY';
const MIN_ROCKETCHAT_VERSION = '0.70.0';

const STATUSES = ['offline', 'online', 'away', 'busy'];

const RocketChat = {
	TOKEN_KEY,
	CURRENT_SERVER,
	CERTIFICATE_KEY,
	callJitsi,
	callJitsiWithoutServer,
	async subscribeRooms() {
		if (!this.roomsSub) {
			try {
				this.roomsSub = await subscribeRooms.call(this);
			} catch (e) {
				log(e);
			}
		}
	},
	unsubscribeRooms() {
		if (this.roomsSub) {
			this.roomsSub.stop();
			this.roomsSub = null;
		}
	},
	canOpenRoom,
	createChannel({ name, users, type, readOnly, broadcast, encrypted, teamId }) {
		const params = {
			name,
			members: users,
			readOnly,
			extraData: {
				broadcast,
				encrypted,
				...(teamId && { teamId })
			}
		};
		return this.post(type ? 'groups.create' : 'channels.create', params);
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
			const response = await RNFetchBlob.fetch('GET', `${server}/api/info`, { ...RocketChatSettings.customHeaders });
			try {
				// Try to resolve as json
				const jsonRes = response.json();
				if (!jsonRes?.success) {
					return {
						success: false,
						message: I18n.t('Not_RC_Server', { contact: I18n.t('Contact_your_server_admin') })
					};
				}
				if (compareServerVersion(jsonRes.version, 'lowerThan', MIN_ROCKETCHAT_VERSION)) {
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
	checkAndReopen() {
		return this?.sdk?.checkAndReopen();
	},
	disconnect() {
		this.sdk?.disconnect?.();
		this.sdk = null;
	},
	connect({ server, user, logoutOnError = false }) {
		return new Promise(resolve => {
			if (this?.sdk?.client?.host === server) {
				return resolve();
			} else {
				this.disconnect();
				database.setActiveDB(server);
			}
			reduxStore.dispatch(connectRequest());

			if (this.connectTimeout) {
				clearTimeout(this.connectTimeout);
			}

			if (this.connectingListener) {
				this.connectingListener.then(this.stopListener);
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

			if (this.notifyAllListener) {
				this.notifyAllListener.then(this.stopListener);
			}

			if (this.rolesListener) {
				this.rolesListener.then(this.stopListener);
			}

			if (this.notifyLoggedListener) {
				this.notifyLoggedListener.then(this.stopListener);
			}

			this.unsubscribeRooms();

			EventEmitter.emit('INQUIRY_UNSUBSCRIBE');

			if (this.code) {
				this.code = null;
			}

			// The app can't reconnect if reopen interval is 5s while in development
			this.sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: useSsl(server), reopen: __DEV__ ? 20000 : 5000 });
			this.getSettings();

			this.sdk
				.connect()
				.then(() => {
					console.log('connected');
				})
				.catch(err => {
					console.log('connect error', err);
				});

			this.connectingListener = this.sdk.onStreamData('connecting', () => {
				reduxStore.dispatch(connectRequest());
			});

			this.connectedListener = this.sdk.onStreamData('connected', () => {
				const { connected } = reduxStore.getState().meteor;
				if (connected) {
					return;
				}
				reduxStore.dispatch(connectSuccess());
				const { server: currentServer } = reduxStore.getState().server;
				if (user?.token && server === currentServer) {
					reduxStore.dispatch(loginRequest({ resume: user.token }, logoutOnError));
				}
			});

			this.closeListener = this.sdk.onStreamData('close', () => {
				reduxStore.dispatch(disconnect());
			});

			this.usersListener = this.sdk.onStreamData(
				'users',
				protectedFunction(ddpMessage => RocketChat._setUser(ddpMessage))
			);

			this.notifyAllListener = this.sdk.onStreamData(
				'stream-notify-all',
				protectedFunction(async ddpMessage => {
					const { eventName } = ddpMessage.fields;
					if (/public-settings-changed/.test(eventName)) {
						const { _id, value } = ddpMessage.fields.args[1];
						const db = database.active;
						const settingsCollection = db.get('settings');
						try {
							const settingsRecord = await settingsCollection.find(_id);
							const { type } = defaultSettings[_id];
							if (type) {
								await db.action(async () => {
									await settingsRecord.update(u => {
										u[type] = value;
									});
								});
							}
							reduxStore.dispatch(updateSettings(_id, value));
						} catch (e) {
							log(e);
						}
					}
				})
			);

			this.rolesListener = this.sdk.onStreamData(
				'stream-roles',
				protectedFunction(ddpMessage => onRolesChanged(ddpMessage))
			);

			// RC 4.1
			this.sdk.onStreamData('stream-user-presence', ddpMessage => {
				const userStatus = ddpMessage.fields.args[0];
				const { uid } = ddpMessage.fields;
				const [, status, statusText] = userStatus;
				const newStatus = { status: STATUSES[status], statusText };
				reduxStore.dispatch(setActiveUsers({ [uid]: newStatus }));

				const { user: loggedUser } = reduxStore.getState().login;
				if (loggedUser && loggedUser.id === uid) {
					reduxStore.dispatch(setUser(newStatus));
				}
			});

			this.notifyLoggedListener = this.sdk.onStreamData(
				'stream-notify-logged',
				protectedFunction(async ddpMessage => {
					const { eventName } = ddpMessage.fields;

					// `user-status` event is deprecated after RC 4.1 in favor of `stream-user-presence/${uid}`
					if (/user-status/.test(eventName)) {
						this.activeUsers = this.activeUsers || {};
						if (!this._setUserTimer) {
							this._setUserTimer = setTimeout(() => {
								const activeUsersBatch = this.activeUsers;
								InteractionManager.runAfterInteractions(() => {
									reduxStore.dispatch(setActiveUsers(activeUsersBatch));
								});
								this._setUserTimer = null;
								return (this.activeUsers = {});
							}, 10000);
						}
						const userStatus = ddpMessage.fields.args[0];
						const [id, , status, statusText] = userStatus;
						this.activeUsers[id] = { status: STATUSES[status], statusText };

						const { user: loggedUser } = reduxStore.getState().login;
						if (loggedUser && loggedUser.id === id) {
							reduxStore.dispatch(setUser({ status: STATUSES[status], statusText }));
						}
					} else if (/updateAvatar/.test(eventName)) {
						const { username, etag } = ddpMessage.fields.args[0];
						const db = database.active;
						const userCollection = db.get('users');
						try {
							const [userRecord] = await userCollection.query(Q.where('username', Q.eq(username))).fetch();
							await db.action(async () => {
								await userRecord.update(u => {
									u.avatarETag = etag;
								});
							});
						} catch {
							// We can't create a new record since we don't receive the user._id
						}
					} else if (/permissions-changed/.test(eventName)) {
						const { _id, roles } = ddpMessage.fields.args[1];
						const db = database.active;
						const permissionsCollection = db.get('permissions');
						try {
							const permissionsRecord = await permissionsCollection.find(_id);
							await db.action(async () => {
								await permissionsRecord.update(u => {
									u.roles = roles;
								});
							});
							reduxStore.dispatch(updatePermission(_id, roles));
						} catch (err) {
							//
						}
					} else if (/Users:NameChanged/.test(eventName)) {
						const userNameChanged = ddpMessage.fields.args[0];
						const db = database.active;
						const userCollection = db.get('users');
						try {
							const userRecord = await userCollection.find(userNameChanged._id);
							await db.action(async () => {
								await userRecord.update(u => {
									Object.assign(u, userNameChanged);
								});
							});
						} catch {
							// User not found
							await db.action(async () => {
								await userCollection.create(u => {
									u._raw = sanitizedRaw({ id: userNameChanged._id }, userCollection.schema);
									Object.assign(u, userNameChanged);
								});
							});
						}
					}
				})
			);

			resolve();
		});
	},

	async shareExtensionInit(server) {
		database.setShareDB(server);

		try {
			const certificate = await UserPreferences.getStringAsync(`${RocketChat.CERTIFICATE_KEY}-${server}`);
			await SSLPinning.setCertificate(certificate, server);
		} catch {
			// Do nothing
		}

		if (this.shareSDK) {
			this.shareSDK.disconnect();
			this.shareSDK = null;
		}

		this.shareSDK = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: useSsl(server) });

		// set Server
		const currentServer = { server };
		const serversDB = database.servers;
		const serversCollection = serversDB.get('servers');
		try {
			const serverRecord = await serversCollection.find(server);
			currentServer.version = serverRecord.version;
		} catch {
			// Record not found
		}
		reduxStore.dispatch(shareSelectServer(currentServer));

		RocketChat.setCustomEmojis();

		try {
			// set Settings
			const settings = ['Accounts_AvatarBlockUnauthenticatedAccess'];
			const db = database.active;
			const settingsCollection = db.get('settings');
			const settingsRecords = await settingsCollection.query(Q.where('id', Q.oneOf(settings))).fetch();
			const parsed = Object.values(settingsRecords).map(item => ({
				_id: item.id,
				valueAsString: item.valueAsString,
				valueAsBoolean: item.valueAsBoolean,
				valueAsNumber: item.valueAsNumber,
				valueAsArray: item.valueAsArray,
				_updatedAt: item._updatedAt
			}));
			reduxStore.dispatch(shareSetSettings(this.parseSettings(parsed)));

			// set User info
			const userId = await UserPreferences.getStringAsync(`${RocketChat.TOKEN_KEY}-${server}`);
			const userCollections = serversDB.get('users');
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

		reduxStore.dispatch(shareSelectServer({}));
		reduxStore.dispatch(shareSetUser({}));
		reduxStore.dispatch(shareSetSettings({}));
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
		return this.methodCallWrapper('stream-notify-room-users', `${rid}/e2ekeyRequest`, rid, e2eKeyId);
	},
	e2eResetOwnKey() {
		this.unsubscribeRooms();

		// RC 0.72.0
		return this.methodCallWrapper('e2e.resetOwnE2EKey');
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

	sendConfirmationEmail(email) {
		return this.methodCallWrapper('sendConfirmationEmail', email);
	},

	loginTOTP(params, loginEmailPassword, isFromWebView = false) {
		return new Promise(async (resolve, reject) => {
			try {
				const result = await this.login(params, isFromWebView);
				return resolve(result);
			} catch (e) {
				if (e.data?.error && (e.data.error === 'totp-required' || e.data.error === 'totp-invalid')) {
					const { details } = e.data;
					try {
						const code = await twoFactor({ method: details?.method || 'totp', invalid: details?.error === 'totp-invalid' });

						if (loginEmailPassword) {
							reduxStore.dispatch(setUser({ username: params.user || params.username }));

							// Force normalized params for 2FA starting RC 3.9.0.
							const serverVersion = reduxStore.getState().server.version;
							if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.9.0')) {
								const user = params.user ?? params.username;
								const password = params.password ?? params.ldapPass ?? params.crowdPassword;
								params = { user, password };
							}

							return resolve(this.loginTOTP({ ...params, code: code?.twoFactorCode }, loginEmailPassword));
						}

						return resolve(
							this.loginTOTP({
								totp: {
									login: {
										...params
									},
									code: code?.twoFactorCode
								}
							})
						);
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

	async loginOAuthOrSso(params, isFromWebView = true) {
		const result = await this.loginTOTP(params, false, isFromWebView);
		reduxStore.dispatch(loginRequest({ resume: result.token }, false, isFromWebView));
	},

	async login(credentials, isFromWebView = false) {
		const sdk = this.shareSDK || this.sdk;
		// RC 0.64.0
		await sdk.login(credentials);
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
			avatarETag: result.me.avatarETag,
			isFromWebView,
			showMessageInMainThread: result.me.settings?.preferences?.showMessageInMainThread ?? true,
			enableMessageParserEarlyAdoption: result.me.settings?.preferences?.enableMessageParserEarlyAdoption ?? true
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
			await serversDB.action(async () => {
				const serverCollection = serversDB.get('servers');
				const serverRecord = await serverCollection.find(server);
				await serverRecord.update(s => {
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
		return new Promise(async resolve => {
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
	loadSurroundingMessages,
	loadNextMessages,
	loadThreadMessages,
	sendMessage,
	getRooms,
	readMessages,
	resendMessage,

	async localSearch({ text, filterUsers = true, filterRooms = true }) {
		const searchText = text.trim();
		const db = database.active;
		const likeString = sanitizeLikeString(searchText);
		let data = await db
			.get('subscriptions')
			.query(
				Q.or(Q.where('name', Q.like(`%${likeString}%`)), Q.where('fname', Q.like(`%${likeString}%`))),
				Q.experimentalSortBy('room_updated_at', Q.desc)
			)
			.fetch();

		if (filterUsers && !filterRooms) {
			data = data.filter(item => item.t === 'd' && !RocketChat.isGroupChat(item));
		} else if (!filterUsers && filterRooms) {
			data = data.filter(item => item.t !== 'd' || RocketChat.isGroupChat(item));
		}

		data = data.slice(0, 7);

		data = data.map(sub => ({
			rid: sub.rid,
			name: sub.name,
			fname: sub.fname,
			avatarETag: sub.avatarETag,
			t: sub.t,
			encrypted: sub.encrypted,
			lastMessage: sub.lastMessage,
			...(sub.teamId && { teamId: sub.teamId })
		}));

		return data;
	},

	async search({ text, filterUsers = true, filterRooms = true }) {
		const searchText = text.trim();

		if (this.oldPromise) {
			this.oldPromise('cancel');
		}

		const data = await this.localSearch({ text, filterUsers, filterRooms });

		const usernames = data.map(sub => sub.name);
		try {
			if (data.length < 7) {
				const { users, rooms } = await Promise.race([
					RocketChat.spotlight(searchText, usernames, { users: filterUsers, rooms: filterRooms }),
					new Promise((resolve, reject) => (this.oldPromise = reject))
				]);
				if (filterUsers) {
					users
						.filter((item1, index) => users.findIndex(item2 => item2._id === item1._id) === index) // Remove duplicated data from response
						.filter(user => !data.some(sub => user.username === sub.name)) // Make sure to remove users already on local database
						.forEach(user => {
							data.push({
								...user,
								rid: user.username,
								name: user.username,
								t: 'd',
								search: true
							});
						});
				}
				if (filterRooms) {
					rooms.forEach(room => {
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

	createDiscussion({ prid, pmid, t_name, reply, users, encrypted }) {
		// RC 1.0.0
		return this.post('rooms.createDiscussion', {
			prid,
			pmid,
			t_name,
			reply,
			users,
			encrypted
		});
	},
	getDiscussions({ roomId, offset, count, text }) {
		const params = {
			roomId,
			offset,
			count,
			...(text && { text })
		};
		// RC 2.4.0
		return this.sdk.get('chat.getDiscussions', params);
	},
	createTeam({ name, users, type, readOnly, broadcast, encrypted }) {
		const params = {
			name,
			users,
			type: type ? TEAM_TYPE.PRIVATE : TEAM_TYPE.PUBLIC,
			room: {
				readOnly,
				extraData: {
					broadcast,
					encrypted
				}
			}
		};
		// RC 3.13.0
		return this.post('teams.create', params);
	},
	addRoomsToTeam({ teamId, rooms }) {
		// RC 3.13.0
		return this.post('teams.addRooms', { teamId, rooms });
	},
	removeTeamRoom({ roomId, teamId }) {
		// RC 3.13.0
		return this.post('teams.removeRoom', { roomId, teamId });
	},
	leaveTeam({ teamId, rooms }) {
		// RC 3.13.0
		return this.post('teams.leave', {
			teamId,
			// RC 4.2.0
			...(rooms?.length && { rooms })
		});
	},
	removeTeamMember({ teamId, userId, rooms }) {
		// RC 3.13.0
		return this.post('teams.removeMember', {
			teamId,
			userId,
			// RC 4.2.0
			...(rooms?.length && { rooms })
		});
	},
	updateTeamRoom({ roomId, isDefault }) {
		// RC 3.13.0
		return this.post('teams.updateRoom', { roomId, isDefault });
	},
	deleteTeam({ teamId, roomsToRemove }) {
		// RC 3.13.0
		return this.post('teams.delete', { teamId, roomsToRemove });
	},
	teamListRoomsOfUser({ teamId, userId }) {
		// RC 3.13.0
		return this.sdk.get('teams.listRoomsOfUser', { teamId, userId });
	},
	getTeamInfo({ teamId }) {
		// RC 3.13.0
		return this.sdk.get('teams.info', { teamId });
	},
	convertChannelToTeam({ rid, name, type }) {
		const params = {
			...(type === 'c'
				? {
						channelId: rid,
						channelName: name
				  }
				: {
						roomId: rid,
						roomName: name
				  })
		};
		return this.sdk.post(type === 'c' ? 'channels.convertToTeam' : 'groups.convertToTeam', params);
	},
	convertTeamToChannel({ teamId, selected }) {
		const params = {
			teamId,
			...(selected.length && { roomsToRemove: selected })
		};
		return this.sdk.post('teams.convertToChannel', params);
	},
	joinRoom(roomId, joinCode, type) {
		// TODO: join code
		// RC 0.48.0
		if (type === 'p') {
			return this.methodCallWrapper('joinRoom', roomId);
		}
		return this.post('channels.join', { roomId, joinCode });
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
	subscribeSettings,
	getPermissions,
	setPermissions,
	getCustomEmojis,
	setCustomEmojis,
	getEnterpriseModules,
	setEnterpriseModules,
	hasLicense,
	isOmnichannelModuleAvailable,
	getSlashCommands,
	getRoles,
	setRoles,
	parseSettings: settings =>
		settings.reduce((ret, item) => {
			ret[item._id] = defaultSettings[item._id] && item[defaultSettings[item._id].type];
			if (item._id === 'Hide_System_Messages') {
				ret[item._id] = ret[item._id].reduce(
					(array, value) => [...array, ...(value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value])],
					[]
				);
			}
			return ret;
		}, {}),
	_prepareSettings(settings) {
		return settings.map(setting => {
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
			const room = await db.get('subscriptions').find(rid);
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
		return `${server}/${roomType}/${this.isGroupChat(room) ? room.rid : room.name}?msg=${message.id}`;
	},
	getPermalinkChannel(channel) {
		const { server } = reduxStore.getState().server;
		const roomType = {
			p: 'group',
			c: 'channel',
			d: 'direct'
		}[channel.t];
		return `${server}/${roomType}/${channel.name}`;
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
		return this.methodCall('stream-notify-room', `${room}/typing`, name, typing);
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
	async getRoomMembers({ rid, allUsers, roomType, type, filter, skip = 0, limit = 10 }) {
		const serverVersion = reduxStore.getState().server.version;
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.16.0')) {
			const params = {
				roomId: rid,
				offset: skip,
				count: limit,
				...(type !== 'all' && { 'status[]': type }),
				...(filter && { filter })
			};
			// RC 3.16.0
			const result = await this.sdk.get(`${this.roomTypeToApiType(roomType)}.members`, params);
			return result?.members;
		}
		// RC 0.42.0
		const result = await this.methodCallWrapper('getUsersOfRoom', rid, allUsers, { skip, limit });
		return result?.records;
	},
	methodCallWrapper(method, ...params) {
		const { API_Use_REST_For_DDP_Calls } = reduxStore.getState().settings;
		const { user } = reduxStore.getState().login;
		if (API_Use_REST_For_DDP_Calls) {
			const url = isEmpty(user) ? 'method.callAnon' : 'method.call';
			return this.post(`${url}/${method}`, {
				message: EJSON.stringify({ method, params })
			});
		}
		const parsedParams = params.map(param => {
			if (param instanceof Date) {
				return { $date: new Date(param).getTime() };
			}
			return param;
		});
		return this.methodCall(method, ...parsedParams);
	},

	getUserRoles() {
		// RC 0.27.0
		return this.methodCallWrapper('getUserRoles');
	},
	getRoomCounters(roomId, t) {
		// RC 0.65.0
		return this.sdk.get(`${this.roomTypeToApiType(t)}.counters`, { roomId });
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
	getTeamListRoom({ teamId, count, offset, type, filter }) {
		const params = {
			teamId,
			count,
			offset,
			type
		};

		if (filter) {
			params.filter = filter;
		}
		// RC 3.13.0
		return this.sdk.get('teams.listRooms', params);
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
	getDepartmentInfo(departmentId) {
		// RC 2.2.0
		return this.sdk.get(`livechat/department/${departmentId}?includeAgents=false`);
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
		return this.sdk.get(`livechat/agents/${uid}/departments?enabledDepartmentsOnly=true`);
	},
	getCustomFields() {
		// RC 2.2.0
		return this.sdk.get('livechat/custom-fields');
	},

	getListCannedResponse({ scope = '', departmentId = '', offset = 0, count = 25, text = '' }) {
		const params = {
			offset,
			count,
			...(departmentId && { departmentId }),
			...(text && { text }),
			...(scope && { scope })
		};

		// RC 3.17.0
		return this.sdk.get('canned-responses', params);
	},

	getUidDirectMessage(room) {
		const { id: userId } = reduxStore.getState().login.user;

		if (!room) {
			return false;
		}

		// legacy method
		if (!room?.uids && room.rid && room.t === 'd') {
			return room.rid.replace(userId, '').trim();
		}

		if (RocketChat.isGroupChat(room)) {
			return false;
		}

		const me = room.uids?.find(uid => uid === userId);
		const other = room.uids?.filter(uid => uid !== userId);

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
		return this.post(`${this.roomTypeToApiType(t)}.leave`, { roomId });
	},
	deleteRoom(roomId, t) {
		// RC 0.49.0
		return this.post(`${this.roomTypeToApiType(t)}.delete`, { roomId });
	},
	toggleMuteUserInRoom(rid, username, mute) {
		if (mute) {
			// RC 0.51.0
			return this.methodCallWrapper('muteUserInRoom', { rid, username });
		}
		// RC 0.51.0
		return this.methodCallWrapper('unmuteUserInRoom', { rid, username });
	},
	toggleRoomOwner({ roomId, t, userId, isOwner }) {
		if (isOwner) {
			// RC 0.49.4
			return this.post(`${this.roomTypeToApiType(t)}.addOwner`, { roomId, userId });
		}
		// RC 0.49.4
		return this.post(`${this.roomTypeToApiType(t)}.removeOwner`, { roomId, userId });
	},
	toggleRoomLeader({ roomId, t, userId, isLeader }) {
		if (isLeader) {
			// RC 0.58.0
			return this.post(`${this.roomTypeToApiType(t)}.addLeader`, { roomId, userId });
		}
		// RC 0.58.0
		return this.post(`${this.roomTypeToApiType(t)}.removeLeader`, { roomId, userId });
	},
	toggleRoomModerator({ roomId, t, userId, isModerator }) {
		if (isModerator) {
			// RC 0.49.4
			return this.post(`${this.roomTypeToApiType(t)}.addModerator`, { roomId, userId });
		}
		// RC 0.49.4
		return this.post(`${this.roomTypeToApiType(t)}.removeModerator`, { roomId, userId });
	},
	removeUserFromRoom({ roomId, t, userId }) {
		// RC 0.48.0
		return this.post(`${this.roomTypeToApiType(t)}.kick`, { roomId, userId });
	},
	ignoreUser({ rid, userId, ignore }) {
		return this.sdk.get('chat.ignoreUser', { rid, userId, ignore });
	},
	toggleArchiveRoom(roomId, t, archive) {
		if (archive) {
			// RC 0.48.0
			return this.post(`${this.roomTypeToApiType(t)}.archive`, { roomId });
		}
		// RC 0.48.0
		return this.post(`${this.roomTypeToApiType(t)}.unarchive`, { roomId });
	},
	hideRoom(roomId, t) {
		return this.post(`${this.roomTypeToApiType(t)}.close`, { roomId });
	},
	saveRoomSettings(rid, params) {
		// RC 0.55.0
		return this.methodCallWrapper('saveRoomSettings', rid, params);
	},
	post(...args) {
		return new Promise(async (resolve, reject) => {
			const isMethodCall = args[0]?.startsWith('method.call/');
			try {
				const result = await this.sdk.post(...args);

				/**
				 * if API_Use_REST_For_DDP_Calls is enabled and it's a method call,
				 * responses have a different object structure
				 */
				if (isMethodCall) {
					const response = JSON.parse(result.message);
					if (response?.error) {
						throw response.error;
					}
					return resolve(response.result);
				}
				return resolve(result);
			} catch (e) {
				const errorType = isMethodCall ? e?.error : e?.data?.errorType;
				const totpInvalid = 'totp-invalid';
				const totpRequired = 'totp-required';
				if ([totpInvalid, totpRequired].includes(errorType)) {
					const { details } = isMethodCall ? e : e?.data;
					try {
						await twoFactor({ method: details?.method, invalid: errorType === totpInvalid });
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
		return new Promise(async (resolve, reject) => {
			try {
				const result = await this.sdk?.methodCall(...args, this.code || '');
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
		const userRoles = shareUser?.roles || loginUser?.roles || [];

		return userRoles.indexOf(r => r === role) > -1;
	},
	getRoomRoles(roomId, type) {
		// RC 0.65.0
		return this.sdk.get(`${this.roomTypeToApiType(type)}.roles`, { roomId });
	},
	/**
	 * Permissions: array of permissions' roles from redux. Example: [['owner', 'admin'], ['leader']]
	 * Returns an array of boolean for each permission from permissions arg
	 */
	async hasPermission(permissions, rid) {
		let roomRoles = [];
		if (rid) {
			const db = database.active;
			const subsCollection = db.get('subscriptions');
			try {
				// get the room from database
				const room = await subsCollection.find(rid);
				// get room roles
				roomRoles = room.roles || [];
			} catch (error) {
				console.log('hasPermission -> Room not found');
				return permissions.map(() => false);
			}
		}

		try {
			const shareUser = reduxStore.getState().share.user;
			const loginUser = reduxStore.getState().login.user;
			// get user roles on the server from redux
			const userRoles = shareUser?.roles || loginUser?.roles || [];
			const mergedRoles = [...new Set([...roomRoles, ...userRoles])];
			return permissions.map(permission => permission?.some(r => mergedRoles.includes(r) ?? false));
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
			const loginServicesResult = await fetch(`${server}/api/v1/settings.oauth`).then(response => response.json());

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
		const { name, custom, showButton = true, service } = services;

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
			c: 'channels',
			d: 'im',
			p: 'groups',
			l: 'channels'
		};
		return types[t];
	},
	getFiles(roomId, type, offset) {
		// RC 0.59.0
		return this.sdk.get(`${this.roomTypeToApiType(type)}.files`, {
			roomId,
			offset,
			sort: { uploadedAt: -1 }
		});
	},
	getMessages(roomId, type, query, offset) {
		// RC 0.59.0
		return this.sdk.get(`${this.roomTypeToApiType(type)}.messages`, {
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
	searchMessages(roomId, searchText, count, offset) {
		// RC 0.60.0
		return this.sdk.get('chat.search', {
			roomId,
			searchText,
			count,
			offset
		});
	},
	toggleFollowMessage(mid, follow) {
		// RC 1.0
		if (follow) {
			return this.post('chat.followMessage', { mid });
		}
		return this.post('chat.unfollowMessage', { mid });
	},
	getThreadsList({ rid, count, offset, text }) {
		const params = {
			rid,
			count,
			offset,
			sort: { ts: -1 }
		};
		if (text) {
			params.text = text;
		}

		// RC 1.0
		return this.sdk.get('chat.getThreadsList', params);
	},
	getSyncThreadsList({ rid, updatedSince }) {
		// RC 1.0
		return this.sdk.get('chat.syncThreadsList', {
			rid,
			updatedSince
		});
	},
	readThreads(tmid) {
		const serverVersion = reduxStore.getState().server.version;
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.4.0')) {
			// RC 3.4.0
			return this.methodCallWrapper('readThreads', tmid);
		}
		return Promise.resolve();
	},
	runSlashCommand(command, roomId, params, triggerId, tmid) {
		// RC 0.60.2
		return this.post('commands.run', {
			command,
			roomId,
			params,
			triggerId,
			tmid
		});
	},
	getCommandPreview(command, roomId, params) {
		// RC 0.65.0
		return this.sdk.get('commands.preview', {
			command,
			roomId,
			params
		});
	},
	executeCommandPreview(command, params, roomId, previewItem, triggerId, tmid) {
		// RC 0.65.0
		return this.post('commands.preview', {
			command,
			params,
			roomId,
			previewItem,
			triggerId,
			tmid
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

		const serverVersion = reduxStore.getState().server.version;
		if (compareServerVersion(serverVersion, 'lowerThan', '4.1.0')) {
			if (!this._setUserTimer) {
				this._setUserTimer = setTimeout(() => {
					const activeUsersBatch = this.activeUsers;
					InteractionManager.runAfterInteractions(() => {
						reduxStore.dispatch(setActiveUsers(activeUsersBatch));
					});
					this._setUserTimer = null;
					return (this.activeUsers = {});
				}, 10000);
			}
		}

		if (!ddpMessage.fields) {
			this.activeUsers[ddpMessage.id] = { status: 'offline' };
		} else if (ddpMessage.fields.status) {
			this.activeUsers[ddpMessage.id] = { status: ddpMessage.fields.status };
		}
	},
	getUserPresence,
	subscribeUsersPresence,
	getDirectory({ query, count, offset, sort }) {
		// RC 1.0
		return this.sdk.get('directory', {
			query,
			count,
			offset,
			sort
		});
	},
	canAutoTranslate() {
		try {
			const { AutoTranslate_Enabled } = reduxStore.getState().settings;
			if (!AutoTranslate_Enabled) {
				return false;
			}
			const autoTranslatePermission = reduxStore.getState().permissions['auto-translate'];
			const userRoles = reduxStore.getState().login?.user?.roles ?? [];
			return autoTranslatePermission?.some(role => userRoles.includes(role));
		} catch (e) {
			log(e);
			return false;
		}
	},
	saveAutoTranslate({ rid, field, value, options }) {
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
		const { UI_Use_Real_Name: useRealName, UI_Allow_room_names_with_special_chars: allowSpecialChars } =
			reduxStore.getState().settings;
		const { username } = reduxStore.getState().login.user;
		if (RocketChat.isGroupChat(room) && !(room.name && room.name.length)) {
			return room.usernames
				.filter(u => u !== username)
				.sort((u1, u2) => u1.localeCompare(u2))
				.join(', ');
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

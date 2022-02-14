import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import AsyncStorage from '@react-native-community/async-storage';
import { Rocketchat as RocketchatClient, settings as RocketChatSettings } from '@rocket.chat/sdk';
import { InteractionManager } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import { setActiveUsers } from '../../actions/activeUsers';
import { connectRequest, connectSuccess, disconnect } from '../../actions/connect';
import { encryptionInit } from '../../actions/encryption';
import { loginRequest, setLoginServices, setUser } from '../../actions/login';
import { updatePermission } from '../../actions/permissions';
import { selectServerFailure } from '../../actions/server';
import { updateSettings } from '../../actions/settings';
import { shareSelectServer, shareSetSettings, shareSetUser } from '../../actions/share';
import defaultSettings from '../../constants/settings';
import { TEAM_TYPE } from '../../definitions/ITeam';
import I18n from '../../i18n';
import { getDeviceToken } from '../../notifications/push';
import { getBundleId, isIOS } from '../../utils/deviceInfo';
import EventEmitter from '../../utils/events';
import fetch from '../../utils/fetch';
import log from '../../utils/log';
import SSLPinning from '../../utils/sslPinning';
import { twoFactor } from '../../utils/twoFactor';
import { useSsl } from '../../utils/url';
import database from '../database';
import { sanitizeLikeString } from '../database/utils';
import { Encryption } from '../encryption';
import triggerBlockAction, { triggerCancel, triggerSubmitView } from '../methods/actions';
import callJitsi, { callJitsiWithoutServer } from '../methods/callJitsi';
import canOpenRoom from '../methods/canOpenRoom';
import {
	getEnterpriseModules,
	hasLicense,
	isOmnichannelModuleAvailable,
	setEnterpriseModules
} from '../methods/enterpriseModules';
import { getCustomEmojis, setCustomEmojis } from '../methods/getCustomEmojis';
import { getPermissions, setPermissions } from '../methods/getPermissions';
import { getRoles, onRolesChanged, setRoles } from '../methods/getRoles';
import getRooms from '../methods/getRooms';
import getSettings, { getLoginSettings, setSettings, subscribeSettings } from '../methods/getSettings';
import getSlashCommands from '../methods/getSlashCommands';
import protectedFunction from '../methods/helpers/protectedFunction';
import loadMessagesForRoom from '../methods/loadMessagesForRoom';
import loadMissedMessages from '../methods/loadMissedMessages';
import loadNextMessages from '../methods/loadNextMessages';
import loadSurroundingMessages from '../methods/loadSurroundingMessages';
import loadThreadMessages from '../methods/loadThreadMessages';
import logout, { removeServer } from '../methods/logout';
import readMessages from '../methods/readMessages';
import { cancelUpload, isUploadActive, sendFileMessage } from '../methods/sendFileMessage';
import sendMessage, { resendMessage } from '../methods/sendMessage';
import subscribeRooms from '../methods/subscriptions/rooms';
import UserPreferences from '../userPreferences';
import { compareServerVersion } from '../utils';
import { getUserPresence, subscribeUsersPresence } from '../methods/getUsersPresence';
import { store as reduxStore } from '../auxStore';
// Methods
import clearCache from './methods/clearCache';
import getPermalinkMessage from './methods/getPermalinkMessage';
import getRoom from './methods/getRoom';
import isGroupChat from './methods/isGroupChat';
import roomTypeToApiType from './methods/roomTypeToApiType';
import getUserInfo from './services/getUserInfo';
// Services
import sdk from './services/sdk';
import toggleFavorite from './services/toggleFavorite';
import {
	createChannel,
	e2eSetUserPublicAndPrivateKeys,
	e2eRequestSubscriptionKeys,
	e2eGetUsersOfRoomWithoutKey,
	e2eSetRoomKeyID,
	e2eUpdateGroupKey,
	e2eRequestRoomKey,
	updateJitsiTimeout,
	register,
	forgotPassword,
	sendConfirmationEmail,
	spotlight,
	createDirectMessage,
	createDiscussion,
	getDiscussions,
	createTeam,
	addRoomsToTeam,
	removeTeamRoom,
	leaveTeam,
	removeTeamMember,
	updateTeamRoom,
	deleteTeam,
	teamListRoomsOfUser,
	getTeamInfo,
	convertChannelToTeam,
	convertTeamToChannel,
	joinRoom,
	deleteMessage,
	markAsUnread,
	toggleStarMessage,
	togglePinMessage,
	reportMessage,
	setUserPreferences,
	setUserStatus,
	setReaction,
	toggleRead,
	getUserRoles,
	getRoomCounters,
	getChannelInfo,
	getUserPreferences,
	getRoomInfo,
	getVisitorInfo
} from './services/restApi';

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
	createChannel,
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
		this.sdk = sdk.disconnect();
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

			this.sdk = sdk.initialize(server);
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

		this.shareSDK = sdk.disconnect();
		this.shareSDK = sdk.initialize(server);

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
		this.shareSDK = sdk.disconnect();
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
	e2eSetUserPublicAndPrivateKeys,
	e2eRequestSubscriptionKeys,
	e2eGetUsersOfRoomWithoutKey,
	e2eSetRoomKeyID,
	e2eUpdateGroupKey,
	e2eRequestRoomKey,
	e2eResetOwnKey() {
		this.unsubscribeRooms();

		// RC 0.72.0
		return this.methodCallWrapper('e2e.resetOwnE2EKey');
	},
	updateJitsiTimeout,
	register,
	forgotPassword,
	sendConfirmationEmail,

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
	clearCache,
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
	spotlight,
	createDirectMessage,
	createGroupChat() {
		const { users } = reduxStore.getState().selectedUsers;
		const usernames = users.map(u => u.name).join(',');

		// RC 3.1.0
		return this.post('im.create', { usernames });
	},

	createDiscussion,
	getDiscussions,
	createTeam,
	addRoomsToTeam,
	removeTeamRoom,
	leaveTeam,
	removeTeamMember,
	updateTeamRoom,
	deleteTeam,
	teamListRoomsOfUser,
	getTeamInfo,
	convertChannelToTeam,
	convertTeamToChannel,
	joinRoom,
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
	deleteMessage,
	async editMessage(message) {
		const { rid, msg } = await Encryption.encryptMessage(message);
		// RC 0.49.0
		return this.post('chat.update', { roomId: rid, msgId: message.id, text: msg });
	},
	markAsUnread,
	toggleStarMessage,
	togglePinMessage,
	reportMessage,
	getRoom,
	getPermalinkMessage,
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
		return sdk.subscribe(...args);
	},
	subscribeRaw(...args) {
		return sdk.subscribeRaw(...args);
	},
	subscribeRoom(...args) {
		return sdk.subscribeRoom(...args);
	},
	unsubscribe(subscription) {
		return sdk.unsubscribe(subscription);
	},
	onStreamData(...args) {
		return sdk.onStreamData(...args);
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
	setUserPreferences,
	setUserStatus,
	setReaction,
	toggleFavorite,
	toggleRead,
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
		return sdk.methodCallWrapper(method, ...params);
	},
	getUserRoles,
	getRoomCounters,
	getChannelInfo,
	getUserInfo,
	getUserPreferences,
	getRoomInfo,
	getVisitorInfo,
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

	isGroupChat,

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
		return sdk.post(...args);
	},
	methodCall(...args) {
		return sdk.methodCall(...args);
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
	roomTypeToApiType,
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

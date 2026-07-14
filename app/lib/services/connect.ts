import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { DDPSDK } from '@rocket.chat/ddp-client';

import log from '../methods/helpers/log';
import { setActiveUsers } from '../../actions/activeUsers';
import protectedFunction from '../methods/helpers/protectedFunction';
import database from '../database';
import { twoFactor } from './twoFactor';
import { store } from '../store/auxStore';
import { loginRequest, logout, setLoginServices, setUser } from '../../actions/login';
import sdk from './sdk';
import { mediaSessionInstance } from './voip/MediaSessionInstance';
import { pendingHangups } from './voip/pendingHangups';
import I18n from '../../i18n';
import { type ICredentials, type ILoggedUser, STATUSES } from '../../definitions';
import { connectRequest, connectSuccess, disconnect as disconnectAction } from '../../actions/connect';
import { updatePermission } from '../../actions/permissions';
import EventEmitter from '../methods/helpers/events';
import { updateSettings } from '../../actions/settings';
import { defaultSettings } from '../constants/defaultSettings';
import { compareServerVersion, hasRole, isIOS } from '../methods/helpers';
import { inquiryRequest } from '../../ee/omnichannel/actions/inquiry';
import { onRolesChanged } from '../methods/getRoles';
import { getSettings } from '../methods/getSettings';
import { setPresenceCap } from '../methods/getUsersPresence';
import { _setUser, type IActiveUsers, _setUserTimer, _activeUsers } from '../methods/setUser';
import { normalizeStatusExpiresAt } from '../methods/helpers/normalizeStatusExpiresAt';
import { unsubscribeRooms } from '../methods/subscribeRooms';
import fetch from '../methods/helpers/fetch';

interface IServices {
	[index: string]: string | boolean;
	name: string;
	custom: boolean;
	showButton: boolean;
	buttonLabelText: string;
	service: string;
}

async function connect({ server, logoutOnError = false }: { server: string; logoutOnError?: boolean }): Promise<void> {
	if (sdk.server === server) {
		return;
	}

	try {
		disconnect();
		database.setActiveDB(server);

		unsubscribeRooms();

		EventEmitter.emit('INQUIRY_UNSUBSCRIBE');

		await sdk.initialize(server);
		await getSettings();

		// A newer connect() call may have switched servers while getSettings() was in flight —
		// bail out rather than wiring up listeners/dispatching against the wrong sdk instance.
		if (sdk.server !== server) {
			return;
		}

		// Tracks a real disconnect so the next `'connected'` can drain hangups the user tapped while
		// the WebSocket was unhealthy. Local to the closure so it resets per `connect()` call.
		let pendingHangupsDrainArmed = false;

		sdk.current?.connection.on('connection', status => {
			if (['connecting', 'reconnecting'].includes(status)) {
				store.dispatch(connectRequest());
			}
			if (status === 'connected') {
				if (pendingHangupsDrainArmed) {
					pendingHangupsDrainArmed = false;
					if (pendingHangups.size > 0) {
						awaitDdpLoggedIn(5000)
							.then(() => mediaSessionInstance.drainPendingHangups())
							.catch(error => log(error));
					}
				}
				const { connected } = store.getState().meteor;
				if (connected) {
					return;
				}
				store.dispatch(connectSuccess());
				const { user } = store.getState().login;
				if (user?.token) {
					store.dispatch(loginRequest({ resume: user.token }, logoutOnError));
				}
				// Omnichannel inquiry queue must be refreshed on (re)connect — the previous SDK had a
				// `'connected'` event that inquiry.ts listened to; the new DDP client's `onCollection`
				// doesn't fire for connection events, so the dispatch is centralized here.
				if (hasRole('livechat-agent') || hasRole('livechat-manager')) {
					store.dispatch(inquiryRequest());
				}
			}
			if (['disconnected', 'closed'].includes(status)) {
				unsubscribeRooms();
				pendingHangupsDrainArmed = true;
				store.dispatch(disconnectAction());
			}
		});
		// Registered before connect() resolves: a rejected or hung connect() must not leave the
		// client without listeners once the underlying socket connects or recovers on its own.
		sdk.onCollection('users', (ddpMessage: unknown) => _setUser(ddpMessage as IActiveUsers));

		sdk.onCollection(
			'stream-notify-all',
			protectedFunction(async (ddpMessage: { fields?: { args?: any; eventName: string } }) => {
				if (!ddpMessage.fields) {
					return;
				}
				const { eventName } = ddpMessage.fields;
				if (/public-settings-changed/.test(eventName)) {
					const { _id, value } = ddpMessage.fields.args[1];
					const db = database.active;
					const settingsCollection = db.get('settings');

					// Check if the _id exists in defaultSettings
					if (defaultSettings.hasOwnProperty(_id)) {
						try {
							const settingsRecord = await settingsCollection.find(_id);
							// @ts-ignore
							const { type } = defaultSettings[_id];
							if (type) {
								await db.write(async () => {
									await settingsRecord.update(u => {
										// @ts-ignore
										u[type] = value;
									});
								});
							}
							store.dispatch(updateSettings(_id, value));

							if (_id === 'Presence_broadcast_disabled') {
								setPresenceCap(value);
							}
						} catch (e) {
							log(e);
						}
					}
				}
			})
		);

		sdk.onCollection(
			'stream-roles',
			protectedFunction((ddpMessage: any) => {
				if (!ddpMessage?.fields) {
					return;
				}
				onRolesChanged(ddpMessage);
			})
		);

		// RC 4.1
		sdk.onCollection('stream-user-presence', ddpMessage => {
			if (ddpMessage.msg === 'added' || ddpMessage.msg === 'changed') {
				if (!ddpMessage.fields) {
					return;
				}
				const userStatus = ddpMessage.fields.args[0];
				const { uid } = ddpMessage.fields;
				const [, status, statusText, statusSource, statusExpiresAtRaw] = userStatus;
				const statusExpiresAt = normalizeStatusExpiresAt(statusExpiresAtRaw);
				const newStatus = { status: STATUSES[status], statusText, statusSource, statusExpiresAt };

				const { user: loggedUser } = store.getState().login;
				if (loggedUser && loggedUser.id === uid) {
					store.dispatch(setUser(newStatus));
				}
			}
		});

		sdk.onCollection(
			'stream-notify-logged',
			protectedFunction(async (ddpMessage: { fields?: { args?: any; eventName?: any } }) => {
				if (!ddpMessage.fields) {
					return;
				}
				const { eventName } = ddpMessage.fields;

				// `user-status` event is deprecated after RC 4.1 in favor of `stream-user-presence/${uid}`
				if (/user-status/.test(eventName)) {
					_activeUsers.activeUsers = _activeUsers.activeUsers || {};
					if (!_setUserTimer.setUserTimer) {
						_setUserTimer.setUserTimer = setTimeout(() => {
							const activeUsersBatch = _activeUsers.activeUsers;
							InteractionManager.runAfterInteractions(() => {
								// @ts-ignore
								store.dispatch(setActiveUsers(activeUsersBatch));
							});
							_setUserTimer.setUserTimer = null;
							_activeUsers.activeUsers = {} as IActiveUsers;
							return null;
						}, 10000);
					}
					const userStatus = ddpMessage.fields.args[0];
					const [id, , status, statusText, statusSource, statusExpiresAtRaw] = userStatus;
					const statusExpiresAt = normalizeStatusExpiresAt(statusExpiresAtRaw);
					_activeUsers.activeUsers[id] = { status: STATUSES[status], statusText, statusSource, statusExpiresAt };

					const { user: loggedUser } = store.getState().login;
					if (loggedUser && loggedUser.id === id) {
						store.dispatch(setUser({ status: STATUSES[status], statusText, statusSource, statusExpiresAt }));
					}
				} else if (/updateAvatar/.test(eventName)) {
					const { username, etag } = ddpMessage.fields.args[0];

					// If it's the logged user, push the new etag through setUser so the
					// servers-DB logged-user record (observed by useAvatarETag) updates,
					// refreshing the avatar in ProfileView, SidebarView, etc.
					const { user: loggedUser } = store.getState().login;
					if (loggedUser?.username === username) {
						store.dispatch(setUser({ avatarETag: etag }));
					}

					const db = database.active;
					const userCollection = db.get('users');
					try {
						const [userRecord] = await userCollection.query(Q.where('username', Q.eq(username))).fetch();
						await db.write(async () => {
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
						await db.write(async () => {
							await permissionsRecord.update(u => {
								u.roles = roles;
							});
						});
						store.dispatch(updatePermission(_id, roles));
					} catch (err) {
						//
					}
				} else if (/Users:NameChanged/.test(eventName)) {
					const userNameChanged = ddpMessage.fields.args[0];
					const db = database.active;
					const userCollection = db.get('users');
					try {
						const userRecord = await userCollection.find(userNameChanged._id);
						await db.write(async () => {
							await userRecord.update(u => {
								Object.assign(u, userNameChanged);
							});
						});
					} catch {
						// User not found
						await db.write(async () => {
							await userCollection.create(u => {
								u._raw = sanitizedRaw({ id: userNameChanged._id }, userCollection.schema);
								Object.assign(u, userNameChanged);
							});
						});
					}
				}
			})
		);

		sdk.onCollection('stream-force_logout', () => store.dispatch(logout(true)));

		await sdk.current?.connection.connect();
	} catch (e) {
		log(e);
		throw e;
	}
}

async function login(credentials: ICredentials): Promise<ILoggedUser | undefined> {
	const result = await sdk.login(credentials);
	const { me } = result;
	const serverVersion = store.getState().server.version;
	const loginUser = sdk.current?.account.user;

	if (!me) {
		throw new Error("Couldn't fetch user data");
	}

	let enableMessageParserEarlyAdoption = true;
	let showMessageInMainThread = false;
	if (compareServerVersion(serverVersion, 'lowerThan', '5.0.0')) {
		enableMessageParserEarlyAdoption = me.settings?.preferences?.enableMessageParserEarlyAdoption ?? true;
		showMessageInMainThread = me.settings?.preferences?.showMessageInMainThread ?? true;
	}

	if (loginUser) {
		const user: ILoggedUser = {
			id: loginUser.id,
			token: loginUser.token as string,
			username: me.username as string,
			name: me.name,
			language: me.language,
			status: me.status as ILoggedUser['status'],
			statusText: me.statusText,
			customFields: me.customFields,
			statusLivechat: me.statusLivechat,
			emails: me.emails,
			roles: me.roles,
			avatarETag: me.avatarETag,
			showMessageInMainThread,
			enableMessageParserEarlyAdoption,
			alsoSendThreadToChannel: me.settings?.preferences?.alsoSendThreadToChannel,
			bio: me.bio,
			nickname: me.nickname,
			requirePasswordChange: me.requirePasswordChange
		};
		return user;
	}
	throw new Error('Login failed: no user returned');
}

function loginTOTP(params: ICredentials, loginEmailPassword?: boolean): Promise<ILoggedUser> {
	return new Promise(async (resolve, reject) => {
		try {
			const result = await login(params);
			if (result) {
				return resolve(result);
			}
		} catch (e: any) {
			if (e.data?.error && (e.data.error === 'totp-required' || e.data.error === 'totp-invalid')) {
				const { details } = e.data;
				try {
					const code = await twoFactor({ method: details?.method || 'totp', invalid: e.data.error === 'totp-invalid' });

					if (loginEmailPassword) {
						store.dispatch(setUser({ username: params.user || params.username }));

						// Force normalized params for 2FA starting RC 3.9.0.
						const serverVersion = store.getState().server.version;
						if (compareServerVersion(serverVersion as string, 'greaterThanOrEqualTo', '3.9.0')) {
							const user = params.user ?? params.username;
							const password = params.password ?? params.ldapPass ?? params.crowdPassword;
							params = { user, password };
						}

						return resolve(loginTOTP({ ...params, code: code?.twoFactorCode }, loginEmailPassword));
					}

					return resolve(
						loginTOTP({
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
}

function loginWithPassword({ user, password }: { user: string; password: string }): Promise<ILoggedUser> {
	let params: ICredentials = { user, password };
	const state = store.getState();

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

	return loginTOTP(params, true);
}

async function loginOAuthOrSso(params: ICredentials) {
	const result = await loginTOTP(params, false);
	store.dispatch(loginRequest({ resume: result.token }, false));
}

function checkAndReopen(): Promise<boolean> {
	return sdk.current?.connection.checkAndReopen() ?? Promise.resolve(false);
}

/**
 * Resolves when the current session is fully logged in (or `timeoutMs` elapses).
 * Trusts redux state rather than the ddp-client's own connection/account state,
 * which isn't cleared on socket close and can appear valid for a stale session.
 * Redux resets to `isAuthenticated=false` on `LOGIN.REQUEST` (dispatched from the
 * `connection.on('connection', ...)` handler in `connect()` when `status ===
 * 'connected'`) and back to true on `LOGIN.SUCCESS`; `meteor.connected` covers
 * the handshake.
 */
async function awaitDdpLoggedIn(timeoutMs: number = 5000): Promise<void> {
	const isReady = () => {
		const s = store.getState();
		return s.login.isAuthenticated && s.meteor.connected;
	};
	if (isReady()) {
		return;
	}
	await new Promise<void>(resolve => {
		const unsub = store.subscribe(() => {
			if (isReady()) {
				clearTimeout(timer);
				unsub();
				resolve();
			}
		});
		const timer = setTimeout(() => {
			unsub();
			resolve();
		}, timeoutMs);
	});
}

function disconnect() {
	const result = sdk.disconnect();
	mediaSessionInstance.reset();
	return result;
}

async function getWebsocketInfo({
	server
}: {
	server: string;
}): Promise<{ success: true } | { success: false; message: string }> {
	let probeSdk: DDPSDK | undefined;
	try {
		probeSdk = await DDPSDK.createAndConnect(server);
		return {
			success: true
		};
	} catch (err: any) {
		if (err?.message?.includes('400')) {
			return {
				success: false,
				message: I18n.t('Websocket_disabled', { contact: I18n.t('Contact_your_server_admin') })
			};
		}

		return {
			success: false,
			message: err?.message || I18n.t('Invalid_URL')
		};
	} finally {
		probeSdk?.connection.close();
	}
}

async function getLoginServices(server: string) {
	try {
		let loginServices = [];
		const loginServicesResult = await fetch(`${server}/api/v1/settings.oauth`).then(response => response.json());

		if (loginServicesResult.success && loginServicesResult.services) {
			const { services } = loginServicesResult;
			loginServices = services;

			const loginServicesReducer = loginServices.reduce((ret: IServices[], item: IServices) => {
				const name = item.name || item.buttonLabelText || item.service;
				const authType = determineAuthType(item);

				if (authType !== 'not_supported') {
					ret[name as unknown as number] = { ...item, name, authType };
				}

				return ret;
			}, {});
			store.dispatch(setLoginServices(loginServicesReducer));
		} else {
			store.dispatch(setLoginServices({}));
		}
	} catch (error) {
		log(error);
		store.dispatch(setLoginServices({}));
	}
}

function determineAuthType(services: IServices) {
	const { name, custom, showButton, service } = services;

	const authName = name || service;

	if (custom && showButton !== false) {
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
}

export {
	login,
	loginTOTP,
	loginWithPassword,
	loginOAuthOrSso,
	checkAndReopen,
	awaitDdpLoggedIn,
	connect,
	disconnect,
	getWebsocketInfo,
	getLoginServices,
	determineAuthType
};

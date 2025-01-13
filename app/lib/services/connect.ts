import { Rocketchat as RocketchatClient } from '@rocket.chat/sdk';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';
import { Q } from '@nozbe/watermelondb';

import log from '../methods/helpers/log';
import { setActiveUsers } from '../../actions/activeUsers';
import protectedFunction from '../methods/helpers/protectedFunction';
import database from '../database';
import { twoFactor } from './twoFactor';
import { store } from '../store/auxStore';
import { loginRequest, logout, setLoginServices, setUser } from '../../actions/login';
import sdk from './sdk';
import I18n from '../../i18n';
import { ICredentials, ILoggedUser, STATUSES } from '../../definitions';
import { connectRequest, connectSuccess, disconnect as disconnectAction } from '../../actions/connect';
import { updatePermission } from '../../actions/permissions';
import EventEmitter from '../methods/helpers/events';
import { updateSettings } from '../../actions/settings';
import { defaultSettings } from '../constants';
import {
	getSettings,
	IActiveUsers,
	unsubscribeRooms,
	_activeUsers,
	_setUser,
	_setUserTimer,
	onRolesChanged,
	setPresenceCap
} from '../methods';
import { compareServerVersion, isIOS, isSsl } from '../methods/helpers';

interface IServices {
	[index: string]: string | boolean;
	name: string;
	custom: boolean;
	showButton: boolean;
	buttonLabelText: string;
	service: string;
}

let connectingListener: any;
let connectedListener: any;
let closeListener: any;
let usersListener: any;
let notifyAllListener: any;
let rolesListener: any;
let notifyLoggedListener: any;
let logoutListener: any;

function connect({ server, logoutOnError = false }: { server: string; logoutOnError?: boolean }): Promise<void> {
	return new Promise<void>(resolve => {
		if (sdk.current?.client?.host === server) {
			return resolve();
		}

		// Check for running requests and abort them before connecting to the server
		abort();

		disconnect();
		database.setActiveDB(server);

		store.dispatch(connectRequest());

		if (connectingListener) {
			connectingListener.then(stopListener);
		}

		if (connectedListener) {
			connectedListener.then(stopListener);
		}

		if (closeListener) {
			closeListener.then(stopListener);
		}

		if (usersListener) {
			usersListener.then(stopListener);
		}

		if (notifyAllListener) {
			notifyAllListener.then(stopListener);
		}

		if (rolesListener) {
			rolesListener.then(stopListener);
		}

		if (notifyLoggedListener) {
			notifyLoggedListener.then(stopListener);
		}

		if (logoutListener) {
			logoutListener.then(stopListener);
		}

		unsubscribeRooms();

		EventEmitter.emit('INQUIRY_UNSUBSCRIBE');

		sdk.initialize(server);
		getSettings();

		sdk.current
			.connect()
			.then(() => {
				console.log('connected');
			})
			.catch((err: unknown) => {
				console.log('connect error', err);
			});

		connectingListener = sdk.current.onStreamData('connecting', () => {
			store.dispatch(connectRequest());
		});

		connectedListener = sdk.current.onStreamData('connected', () => {
			const { connected } = store.getState().meteor;
			if (connected) {
				return;
			}
			store.dispatch(connectSuccess());
			const { user } = store.getState().login;
			if (user?.token) {
				store.dispatch(loginRequest({ resume: user.token }, logoutOnError));
			}
		});

		closeListener = sdk.current.onStreamData('close', () => {
			store.dispatch(disconnectAction());
		});

		usersListener = sdk.current.onStreamData(
			'users',
			protectedFunction((ddpMessage: any) => _setUser(ddpMessage))
		);

		notifyAllListener = sdk.current.onStreamData(
			'stream-notify-all',
			protectedFunction(async (ddpMessage: { fields: { args?: any; eventName: string } }) => {
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
					} else {
						console.warn(`Setting with _id '${_id}' is not present in defaultSettings.`);
					}
				}
			})
		);

		rolesListener = sdk.current.onStreamData(
			'stream-roles',
			protectedFunction((ddpMessage: any) => onRolesChanged(ddpMessage))
		);

		// RC 4.1
		sdk.current.onStreamData('stream-user-presence', (ddpMessage: { fields: { args?: any; uid?: any } }) => {
			const userStatus = ddpMessage.fields.args[0];
			const { uid } = ddpMessage.fields;
			const [, status, statusText] = userStatus;
			const newStatus = { status: STATUSES[status], statusText };
			// @ts-ignore
			store.dispatch(setActiveUsers({ [uid]: newStatus }));

			const { user: loggedUser } = store.getState().login;
			if (loggedUser && loggedUser.id === uid) {
				// @ts-ignore
				store.dispatch(setUser(newStatus));
			}
		});

		notifyLoggedListener = sdk.current.onStreamData(
			'stream-notify-logged',
			protectedFunction(async (ddpMessage: { fields: { args?: any; eventName?: any } }) => {
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
					const [id, , status, statusText] = userStatus;
					_activeUsers.activeUsers[id] = { status: STATUSES[status], statusText };

					const { user: loggedUser } = store.getState().login;
					if (loggedUser && loggedUser.id === id) {
						store.dispatch(setUser({ status: STATUSES[status], statusText }));
					}
				} else if (/updateAvatar/.test(eventName)) {
					const { username, etag } = ddpMessage.fields.args[0];
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

		logoutListener = sdk.current.onStreamData('stream-force_logout', () => store.dispatch(logout(true)));

		resolve();
	});
}

function stopListener(listener: any): boolean {
	return listener && listener.stop();
}

async function login(credentials: ICredentials, isFromWebView = false): Promise<ILoggedUser | undefined> {
	// RC 0.64.0
	await sdk.current.login(credentials);
	const serverVersion = store.getState().server.version;
	const result = sdk.current.currentLogin?.result;

	let enableMessageParserEarlyAdoption = true;
	let showMessageInMainThread = false;
	if (compareServerVersion(serverVersion, 'lowerThan', '5.0.0')) {
		enableMessageParserEarlyAdoption = result.me.settings?.preferences?.enableMessageParserEarlyAdoption ?? true;
		showMessageInMainThread = result.me.settings?.preferences?.showMessageInMainThread ?? true;
	}

	if (result) {
		const user: ILoggedUser = {
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
			showMessageInMainThread,
			enableMessageParserEarlyAdoption,
			alsoSendThreadToChannel: result.me.settings?.preferences?.alsoSendThreadToChannel,
			bio: result.me.bio,
			nickname: result.me.nickname,
			requirePasswordChange: result.me.requirePasswordChange
		};
		return user;
	}
}

function loginTOTP(params: ICredentials, loginEmailPassword?: boolean, isFromWebView = false): Promise<ILoggedUser> {
	return new Promise(async (resolve, reject) => {
		try {
			const result = await login(params, isFromWebView);
			if (result) {
				return resolve(result);
			}
		} catch (e: any) {
			if (e.data?.error && (e.data.error === 'totp-required' || e.data.error === 'totp-invalid')) {
				const { details } = e.data;
				try {
					const code = await twoFactor({ params, method: details?.method || 'totp', invalid: details?.error === 'totp-invalid' });

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

async function loginOAuthOrSso(params: ICredentials, isFromWebView = true) {
	const result = await loginTOTP(params, false, isFromWebView);
	store.dispatch(loginRequest({ resume: result.token }, false, isFromWebView));
}

function abort() {
	if (sdk.current) {
		return sdk.current.abort();
	}
}

function checkAndReopen() {
	return sdk.current.checkAndReopen();
}

function disconnect() {
	return sdk.disconnect();
}

async function getWebsocketInfo({
	server
}: {
	server: string;
}): Promise<{ success: true } | { success: false; message: string }> {
	const websocketSdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: isSsl(server) });

	try {
		await websocketSdk.connect();
	} catch (err: any) {
		if (err.message && err.message.includes('400')) {
			return {
				success: false,
				message: I18n.t('Websocket_disabled', { contact: I18n.t('Contact_your_server_admin') })
			};
		}
	}

	websocketSdk.disconnect();

	return {
		success: true
	};
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
		console.log(error);
		store.dispatch(setLoginServices({}));
	}
}

function determineAuthType(services: IServices) {
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
}

export {
	login,
	loginTOTP,
	loginWithPassword,
	loginOAuthOrSso,
	checkAndReopen,
	abort,
	connect,
	disconnect,
	getWebsocketInfo,
	stopListener,
	getLoginServices,
	determineAuthType
};

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
import I18n from '../../i18n';
import { ICredentials, ILoggedUser, STATUSES } from '../../definitions';
import { connectRequest, connectSuccess, disconnect as disconnectAction } from '../../actions/connect';
import { updatePermission } from '../../actions/permissions';
import EventEmitter from '../methods/helpers/events';
import { updateSettings } from '../../actions/settings';
import { defaultSettings } from '../constants/defaultSettings';
import { compareServerVersion, isIOS } from '../methods/helpers';
import { onRolesChanged } from 'lib/methods/getRoles';
import { getSettings } from 'lib/methods/getSettings';
import { setPresenceCap } from 'lib/methods/getUsersPresence';
import { _setUser, _activeUsers, _setUserTimer } from 'lib/methods/setUser';
import { unsubscribeRooms } from 'lib/methods/subscribeRooms';
import { IActiveUsers } from 'reducers/activeUsers';

interface IServices {
	[index: string]: string | boolean;
	name: string;
	custom: boolean;
	showButton: boolean;
	buttonLabelText: string;
	service: string;
}

function connect({ server, logoutOnError = false }: { server: string; logoutOnError?: boolean }): Promise<void> {
	return new Promise<void>(async resolve => {
		if (sdk.current?.connection.url === server) {
			return resolve();
		}

		disconnect();
		database.setActiveDB(server);

		unsubscribeRooms();

		EventEmitter.emit('INQUIRY_UNSUBSCRIBE');

		await sdk.initialize(server);
		resolve();
		getSettings();

		sdk.current?.connection.on('connection', status => {
			if (['connecting', 'reconnecting'].includes(status)) {
				store.dispatch(connectRequest());
			}
			if (status === 'connected') {
				const { connected } = store.getState().meteor;
				if (connected) {
					return;
				}
				store.dispatch(connectSuccess());
				const { user } = store.getState().login;
				if (user?.token) {
					store.dispatch(loginRequest({ resume: user.token }, logoutOnError));
				}
			}
			if (['disconnected', 'closed'].includes(status)) {
				store.dispatch(disconnectAction());
			}
		});
		await sdk.current?.connection.connect();

		sdk.onCollection('users', (ddpMessage: any) => _setUser(ddpMessage));

		sdk.onCollection(
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

		sdk.onCollection(
			'stream-roles',
			protectedFunction((ddpMessage: any) => onRolesChanged(ddpMessage))
		);

		// RC 4.1
		sdk.onCollection('stream-user-presence', ddpMessage => {
			if (ddpMessage.msg === 'added' || ddpMessage.msg === 'changed') {
				if (!ddpMessage.fields) {
					return;
				}
				const userStatus = ddpMessage.fields.args[0];
				const { uid } = ddpMessage.fields;
				const [, status, statusText] = userStatus;
				const newStatus = { status: STATUSES[status], statusText };
				store.dispatch(setActiveUsers({ [uid]: newStatus }));

				const { user: loggedUser } = store.getState().login;
				if (loggedUser && loggedUser.id === uid) {
					store.dispatch(setUser(newStatus));
				}
			}
		});

		sdk.onCollection(
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
                            //@ts-ignore - fix me
							_activeUsers.activeUsers = {}
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

		sdk.onCollection('stream-force_logout', () => store.dispatch(logout(true)));

		resolve();
	});
}

function stopListener(listener: any): boolean {
	return listener && listener.stop();
}

async function login(credentials: ICredentials, isFromWebView = false): Promise<ILoggedUser | undefined> {
	// TODO: other login methods: ldap, saml, cas, apple, oauth, oauth_custom
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
		// TODO: review type
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
					const code = await twoFactor({ method: details?.method || 'totp', invalid: details?.error === 'totp-invalid' });

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

function checkAndReopen() {
	console.log('TODO: CHECK AND REOPEN: do we need to hurry connection on app foreground?');
}

function disconnect() {
	return sdk.disconnect();
}

async function getWebsocketInfo({
	server
}: {
	server: string;
}): Promise<{ success: true } | { success: false; message: string }> {
	try {
		const sdk = await DDPSDK.createAndConnect(server);
		sdk.connection.close();

		return {
			success: true
		};
	} catch {
		return {
			success: false,
			message: I18n.t('Websocket_disabled', { contact: I18n.t('Contact_your_server_admin') })
		};
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
	connect,
	disconnect,
	getWebsocketInfo,
	stopListener,
	getLoginServices,
	determineAuthType
};
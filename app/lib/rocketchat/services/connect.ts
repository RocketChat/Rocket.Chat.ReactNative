import RNFetchBlob from 'rn-fetch-blob';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';
import { Q } from '@nozbe/watermelondb';

import log from '../../../utils/log';
import { onRolesChanged } from '../../methods/getRoles';
import { setActiveUsers } from '../../../actions/activeUsers';
import protectedFunction from '../../methods/helpers/protectedFunction';
import database from '../../database';
import { selectServerFailure } from '../../../actions/server';
import { twoFactor } from '../../../utils/twoFactor';
import { compareServerVersion } from '../../utils';
import { store } from '../../auxStore';
import { loginRequest, setLoginServices, setUser } from '../../../actions/login';
import sdk from './sdk';
import I18n from '../../../i18n';
import RocketChat, { MIN_ROCKETCHAT_VERSION } from '../rocketchat';
import { ICredentials, ILoggedUser, IRocketChat, STATUSES } from '../../../definitions';
import { isIOS } from '../../../utils/deviceInfo';
import { connectRequest, connectSuccess, disconnect as disconnectAction } from '../../../actions/connect';
import { updatePermission } from '../../../actions/permissions';
import EventEmitter from '../../../utils/events';
import { updateSettings } from '../../../actions/settings';
import defaultSettings from '../../../constants/settings';

interface IServices {
	[index: string]: string | boolean;
	name: string;
	custom: boolean;
	showButton: boolean;
	buttonLabelText: string;
	service: string;
}

// FIXME: Remove `this` context
function connect(
	this: IRocketChat,
	{ server, logoutOnError = false }: { server: string; logoutOnError: boolean }
): Promise<void> {
	return new Promise<void>(resolve => {
		if (sdk.current?.client?.host === server) {
			return resolve();
		}
		disconnect();
		database.setActiveDB(server);

		store.dispatch(connectRequest());

		if (this.connectTimeout) {
			clearTimeout(this.connectTimeout);
		}

		if (this.connectingListener) {
			this.connectingListener.then(stopListener);
		}

		if (this.connectedListener) {
			this.connectedListener.then(stopListener);
		}

		if (this.closeListener) {
			this.closeListener.then(stopListener);
		}

		if (this.usersListener) {
			this.usersListener.then(stopListener);
		}

		if (this.notifyAllListener) {
			this.notifyAllListener.then(stopListener);
		}

		if (this.rolesListener) {
			this.rolesListener.then(stopListener);
		}

		if (this.notifyLoggedListener) {
			this.notifyLoggedListener.then(stopListener);
		}

		this.unsubscribeRooms();

		EventEmitter.emit('INQUIRY_UNSUBSCRIBE');

		sdk.initialize(server);
		this.getSettings();

		sdk.current
			.connect()
			.then(() => {
				console.log('connected');
			})
			.catch((err: unknown) => {
				console.log('connect error', err);
			});

		this.connectingListener = sdk.current.onStreamData('connecting', () => {
			store.dispatch(connectRequest());
		});

		this.connectedListener = sdk.current.onStreamData('connected', () => {
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

		this.closeListener = sdk.current.onStreamData('close', () => {
			store.dispatch(disconnectAction());
		});

		this.usersListener = sdk.current.onStreamData(
			'users',
			protectedFunction((ddpMessage: any) => RocketChat._setUser(ddpMessage))
		);

		this.notifyAllListener = sdk.current.onStreamData(
			'stream-notify-all',
			protectedFunction(async (ddpMessage: { fields: { args?: any; eventName: string } }) => {
				const { eventName } = ddpMessage.fields;
				if (/public-settings-changed/.test(eventName)) {
					const { _id, value } = ddpMessage.fields.args[1];
					const db = database.active;
					const settingsCollection = db.get('settings');
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
					} catch (e) {
						log(e);
					}
				}
			})
		);

		this.rolesListener = sdk.current.onStreamData(
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

		this.notifyLoggedListener = sdk.current.onStreamData(
			'stream-notify-logged',
			protectedFunction(async (ddpMessage: { fields: { args?: any; eventName?: any } }) => {
				const { eventName } = ddpMessage.fields;

				// `user-status` event is deprecated after RC 4.1 in favor of `stream-user-presence/${uid}`
				if (/user-status/.test(eventName)) {
					this.activeUsers = this.activeUsers || {};
					if (!this._setUserTimer) {
						this._setUserTimer = setTimeout(() => {
							const activeUsersBatch = this.activeUsers;
							InteractionManager.runAfterInteractions(() => {
								store.dispatch(setActiveUsers(activeUsersBatch));
							});
							this._setUserTimer = null;
							return (this.activeUsers = {});
						}, 10000);
					}
					const userStatus = ddpMessage.fields.args[0];
					const [id, , status, statusText] = userStatus;
					this.activeUsers[id] = { status: STATUSES[status], statusText };

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

		resolve();
	});
}

function stopListener(listener: any): boolean {
	return listener && listener.stop();
}

async function login(credentials: ICredentials, isFromWebView = false): Promise<ILoggedUser | undefined> {
	// RC 0.64.0
	await sdk.current.login(credentials);
	const result = sdk.current.currentLogin?.result;
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
			showMessageInMainThread: result.me.settings?.preferences?.showMessageInMainThread ?? true,
			enableMessageParserEarlyAdoption: result.me.settings?.preferences?.enableMessageParserEarlyAdoption ?? true
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

function abort() {
	if (sdk.current) {
		return sdk.current.abort();
	}
	return new AbortController();
}

function checkAndReopen() {
	return sdk.current.checkAndReopen();
}

function disconnect() {
	return sdk.disconnect();
}

async function getServerInfo(server: string) {
	try {
		const response = await RNFetchBlob.fetch('GET', `${server}/api/info`, { ...RocketChatSettings.customHeaders });
		try {
			// Try to resolve as json
			const jsonRes: { version?: string; success: boolean } = response.json();
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
	} catch (e: any) {
		if (e?.message) {
			if (e.message === 'Aborted') {
				store.dispatch(selectServerFailure());
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
}

async function getWebsocketInfo({ server }: { server: string }) {
	sdk.initialize(server);

	try {
		await sdk.current.connect();
	} catch (err: any) {
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
	getServerInfo,
	getWebsocketInfo,
	stopListener,
	getLoginServices,
	determineAuthType
};

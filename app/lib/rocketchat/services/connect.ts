import RNFetchBlob from 'rn-fetch-blob';
import { Rocketchat as RocketchatClient, settings as RocketChatSettings } from '@rocket.chat/sdk';

import { useSsl } from '../../../utils/url';
import { selectServerFailure } from '../../../actions/server';
import { twoFactor } from '../../../utils/twoFactor';
import { compareServerVersion } from '../../utils';
import { store } from '../../auxStore';
import { loginRequest, setLoginServices, setUser } from '../../../actions/login';
import sdk from './sdk';
import I18n from '../../../i18n';
import { MIN_ROCKETCHAT_VERSION } from '../rocketchat';
import { ICredentials, ILoggedUser } from '../../../definitions';
import { isIOS } from '../../../utils/deviceInfo';

interface IServices {
	[index: string]: string | boolean;
	name: string;
	custom: boolean;
	showButton: boolean;
	buttonLabelText: string;
	service: string;
}

async function login(credentials: ICredentials, isFromWebView = false): Promise<ILoggedUser | undefined> {
	// RC 0.64.0
	await sdk.current.login(credentials);
	const result = sdk.currentLogin?.result;
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

function loginWithPassword({ user, password }: { user: string; password: string }) {
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
	if (sdk) {
		return sdk.abort();
	}
	return new AbortController();
}

function checkAndReopen() {
	return sdk.checkAndReopen();
}

function disconnect() {
	return sdk.disconnect();
}

async function getServerInfo(server: string) {
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
	const sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: useSsl(server) });

	try {
		await sdk.connect();
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
	disconnect,
	getServerInfo,
	getWebsocketInfo,
	getLoginServices,
	determineAuthType
};

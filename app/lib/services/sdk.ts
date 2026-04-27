import EJSON from 'ejson';
import isEmpty from 'lodash/isEmpty';
import { type ClientStream, DDPSDK } from '@rocket.chat/ddp-client';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { twoFactor } from './twoFactor';
import { store as reduxStore } from '../store/auxStore';
import { random } from '../methods/helpers';
import UserPreferences from '../methods/userPreferences';
import { BASIC_AUTH_KEY } from '../methods/helpers/fetch';
import {
	type Serialized,
	type MatchPathPattern,
	type OperationParams,
	type PathFor,
	type ResultFor
} from '../../definitions/rest/helpers';

class Sdk {
	private sdk: DDPSDK | undefined;
	private code: any = null;
	private headers: Record<string, string> = {
		'User-Agent': `RC Mobile; ${Platform.OS
			} ${DeviceInfo.getSystemVersion()}; v${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`
	};

	async initialize(server: string): Promise<DDPSDK> {
		this.sdk = await DDPSDK.create(server);
		this.setBasicAuth();
		this.sdk.rest.handleTwoFactorChallenge(this.twoFactorHandler);
		return this.sdk;
	}

	private ensureInitialized(): DDPSDK {
		if (!this.current) {
			throw new Error('SDK not initialized');
		}
		return this.current;
	}

	get current() {
		return this.sdk;
	}

	disconnect(): null {
		if (this.sdk) {
			this.sdk.connection.close();
			this.sdk = undefined;
		}
		return null;
	}

	private setBasicAuth(): void {
		const basicAuth = UserPreferences.getString(`${BASIC_AUTH_KEY}-${this.sdk?.connection.url}`);
		if (basicAuth) {
			this.setHeaders({ Authorization: `Basic ${basicAuth}` });
		}
	}

	private setHeaders(headers: Record<string, string>): void {
		this.headers = { ...this.headers, ...headers };
	}

	getHeaders(): Record<string, string> {
		return this.headers;
	}

	/*
	get: DDPSDK['rest']['get'] = (...args: Parameters<DDPSDK['rest']['get']>) => {
		const [endpoint, params, options] = args;
		const sdk = this.ensureInitialized();
		return sdk.rest.get(endpoint, params, {
			...options,
			headers: {
				...this.headers,
				...options?.headers
			}
		});
	};

	post: DDPSDK['rest']['post'] = (...args: Parameters<DDPSDK['rest']['post']>) => {
		const [endpoint, params, options] = args;
		const sdk = this.ensureInitialized();
		return sdk.rest.post(endpoint, params, {
			...options,
			headers: {
				...this.headers,
				...options?.headers
			}
		});
	};

	delete: DDPSDK['rest']['delete'] = (...args: Parameters<DDPSDK['rest']['delete']>) => {
		const [endpoint, params, options] = args;
		const sdk = this.ensureInitialized();
		return sdk.rest.delete(endpoint, params, {
			...options,
			headers: {
				...this.headers,
				...options?.headers
			}
		});
	};
	*/

	get<TPath extends PathFor<'GET'>>(
		endpoint: TPath,
		params: void extends OperationParams<'GET', MatchPathPattern<TPath>>
			? void
			: Serialized<OperationParams<'GET', MatchPathPattern<TPath>>> = undefined as void extends OperationParams<
				'GET',
				MatchPathPattern<TPath>
			>
			? void
			: Serialized<OperationParams<'GET', MatchPathPattern<TPath>>>
	): Promise<Serialized<ResultFor<'GET', MatchPathPattern<TPath>>>> {
		const sdk = this.ensureInitialized();
		// @ts-ignore
		return sdk.rest.get(endpoint, params);
	}

	post<TPath extends PathFor<'POST'>>(
		endpoint: TPath,
		params: void extends OperationParams<'POST', MatchPathPattern<TPath>>
			? void
			: Serialized<OperationParams<'POST', MatchPathPattern<TPath>>> = undefined as void extends OperationParams<
				'POST',
				MatchPathPattern<TPath>
			>
			? void
			: Serialized<OperationParams<'POST', MatchPathPattern<TPath>>>
	): Promise<ResultFor<'POST', MatchPathPattern<TPath>>> {
		return new Promise(async (resolve, reject) => {
			const isMethodCall = endpoint?.startsWith('method.call/');
			try {
				const sdk = this.ensureInitialized();
				// @ts-ignore
				const result = await sdk.rest.post(endpoint, params);

				/**
				 * if API_Use_REST_For_DDP_Calls is enabled and it's a method call,
				 * responses have a different object structure
				 */
				if (isMethodCall) {
					// @ts-ignore
					const response = JSON.parse(result.message);
					if (response?.error) {
						throw response.error;
					}
					return resolve(response.result);
				}
				return resolve(result);
			} catch (e: any) {
				const errorType = isMethodCall ? e?.error : e?.data?.errorType;
				const totpInvalid = 'totp-invalid';
				const totpRequired = 'totp-required';
				if ([totpInvalid, totpRequired].includes(errorType)) {
					const { details } = isMethodCall ? e : e?.data;
					try {
						await twoFactor({ method: details?.method, invalid: errorType === totpInvalid });
						return resolve(this.post(endpoint, params));
					} catch {
						// twoFactor was canceled
						return resolve({} as any);
					}
				} else {
					reject(e);
				}
			}
		});
	}

	delete<TPath extends PathFor<'DELETE'>>(
		endpoint: TPath,
		params: void extends OperationParams<'DELETE', MatchPathPattern<TPath>>
			? void
			: Serialized<OperationParams<'DELETE', MatchPathPattern<TPath>>> = undefined as void extends OperationParams<
				'DELETE',
				MatchPathPattern<TPath>
			>
			? void
			: Serialized<OperationParams<'DELETE', MatchPathPattern<TPath>>>
	): Promise<Serialized<ResultFor<'DELETE', MatchPathPattern<TPath>>>> {
		const sdk = this.ensureInitialized();
		// @ts-ignore
		return sdk.rest.delete(endpoint, params);
	}

	async twoFactorHandler({
		method,
		// emailOrUsername, TODO: what is this for?
		invalidAttempt
	}: {
		method: 'totp' | 'email' | 'password';
		invalidAttempt?: boolean;
	}): Promise<string> {
		const result = await twoFactor({ method, invalid: !!invalidAttempt });
		return result.twoFactorCode;
	}

	async login(credentials: any): Promise<any> {
		try {
			const loginResult = await this.post('/v1/login', credentials);
			if (!loginResult?.success) {
				return Promise.reject(new Error('Invalid response from server'));
			}

			// TODO: get/set headers from SDK instead?
			this.setHeaders({ 'X-Auth-Token': loginResult.data.authToken, 'X-User-Id': loginResult.data.userId });
			await this.current?.account.loginWithToken(loginResult.data.authToken);
			return loginResult.data;
		} catch (e) {
			return Promise.reject(e);
		}
	}

	methodCall(...args: any[]): Promise<any> {
		return new Promise(async (resolve, reject) => {
			try {
				if (!this.current || !this.current.client) {
					throw new Error('SDK not initialized');
				}
				// @ts-ignore
				const result = await this.current.client.callAsyncWithOptions(...args, this.code || '');
				return resolve(result);
			} catch (e: any) {
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
	}

	async methodCallWrapper(method: string, ...params: any[]): Promise<any> {
		const { API_Use_REST_For_DDP_Calls } = reduxStore.getState().settings;
		const { user } = reduxStore.getState().login;
		if (API_Use_REST_For_DDP_Calls) {
			const url = isEmpty(user) ? 'method.callAnon' : 'method.call';
			// TODO: fix this type
			// @ts-ignore
			const result = (await this.post(`/v1/${url}/${method}` as any, {
				message: EJSON.stringify({ msg: 'method', id: random(10), method, params })
			})) as any;
			const response = JSON.parse(result.message) as any;
			if (response?.error) {
				throw response.error;
			}
			return response.result;
		}
		const parsedParams = params.map(param => {
			if (param instanceof Date) {
				return { $date: new Date(param).getTime() };
			}
			return param;
		});
		// @ts-ignore
		return this.methodCall(method, ...parsedParams);
	}

	subscribe(...args: Parameters<ClientStream['subscribe']>) {
		return this.current?.client.subscribe(...args);
	}

	subscribeRoom(rid: string): Promise<any[]> {
		const subscriptions: any[] = [];
		if (!this.current) {
			return Promise.resolve(subscriptions);
		}
		try {
			subscriptions.push(this.current.client.subscribe('stream-room-messages', rid));
			subscriptions.push(this.current.client.subscribe('stream-notify-room', rid, { useCollection: false }));
			return Promise.resolve(subscriptions);
		} catch (e) {
			return Promise.resolve(subscriptions);
		}
	}

	onCollection(...args: Parameters<ClientStream['onCollection']>) {
		return this.current?.client.onCollection(...args);
	}

	onStreamData(name: string, callback: (...data: any) => void): Promise<{ stop: () => void }> {
		return new Promise((resolve) => {
			if (!this.current) {
				resolve({ stop: () => { } });
				return;
			}
			const listener = this.current.client.onCollection(name, (ddpMessage: any) => {
				// DDP stream events come in the format: { msg, collection, id, fields: { eventName, args } }
				if (ddpMessage && ddpMessage.fields) {
					callback(ddpMessage);
				}
			});
			resolve({ stop: listener });
		});
	}

	stream(...args: Parameters<DDPSDK['stream']>) {
		return this.current?.stream(...args);
	}

	subscribeRaw(...args: Parameters<ClientStream['subscribe']>) {
		return this.current?.client.subscribe(...args);
	}

	get currentLogin() {
		const user = this.current?.account.user;
		if (!user) {
			return { userId: '', authToken: '' };
		}
		return {
			userId: user.id,
			authToken: user.token || ''
		};
	}

	get client() {
		return this.current?.client;
	}

	async logout(): Promise<void> {
		if (this.current?.account) {
			await this.current.account.logout();
		}
	}

	_stream(name: string, data: unknown, cb: (...data: any) => void) {
		const [key, args] = Array.isArray(data) ? data : [data];

		if (!this.current) {
			return { stop: () => { } };
		}

		const subscription = this.current.client.subscribe(`stream-${name}`, key, { useCollection: false, args: [args] });

		const stop = subscription.stop.bind(subscription);
		const cancel = [
			() => stop(),
			this.current?.client.onCollection(`stream-${name}`, (data: any) => {
				if (data.collection !== `stream-${name}`) {
					return;
				}
				if (data.msg === 'added') {
					return;
				}
				if (data.fields.eventName === key) {
					cb(data);
				}
			})
		];

		return Object.assign(subscription, {
			stop: () => {
				cancel.forEach(fn => fn());
			}
		});
	}
}

const sdk = new Sdk();

export default sdk;
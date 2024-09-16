import { Rocketchat } from '@rocket.chat/sdk';
import EJSON from 'ejson';
import isEmpty from 'lodash/isEmpty';

import { twoFactor } from './twoFactor';
import { isSsl } from '../methods/helpers/isSsl';
import { store as reduxStore } from '../store/auxStore';
import { Serialized, MatchPathPattern, OperationParams, PathFor, ResultFor } from '../../definitions/rest/helpers';
import { compareServerVersion, random } from '../methods/helpers';

class Sdk {
	private sdk: typeof Rocketchat;
	private code: any;

	private initializeSdk(server: string): typeof Rocketchat {
		// The app can't reconnect if reopen interval is 5s while in development
		return new Rocketchat({ host: server, protocol: 'ddp', useSsl: isSsl(server), reopen: __DEV__ ? 20000 : 5000 });
	}

	// TODO: We need to stop returning the SDK after all methods are dehydrated
	initialize(server: string) {
		this.code = null;
		this.sdk = this.initializeSdk(server);
		return this.sdk;
	}

	get current() {
		return this.sdk;
	}

	/**
	 * TODO: evaluate the need for assigning "null" to this.sdk
	 * I'm returning "null" because we need to remove both instances of this.sdk here and on rocketchat.js
	 */
	disconnect() {
		if (this.sdk) {
			this.sdk.disconnect();
			this.sdk = null;
		}
		return null;
	}

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
		return this.current.get(endpoint, params);
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
				const result = await this.current.post(endpoint, params);

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

	methodCall(...args: any[]): Promise<any> {
		return new Promise(async (resolve, reject) => {
			try {
				const result = await this.current.methodCall(...args, this.code || '');
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

	methodCallWrapper(method: string, ...params: any[]): Promise<any> {
		const { API_Use_REST_For_DDP_Calls } = reduxStore.getState().settings;
		const { user } = reduxStore.getState().login;
		if (API_Use_REST_For_DDP_Calls) {
			const url = isEmpty(user) ? 'method.callAnon' : 'method.call';
			// @ts-ignore
			return this.post(`${url}/${method}`, {
				message: EJSON.stringify({ msg: 'method', id: random(10), method, params })
			});
		}
		const parsedParams = params.map(param => {
			if (param instanceof Date) {
				return { $date: new Date(param).getTime() };
			}
			return param;
		});
		return this.methodCall(method, ...parsedParams);
	}

	subscribe(...args: any[]) {
		return this.current.subscribe(...args);
	}

	subscribeRaw(...args: any[]) {
		return this.current.subscribeRaw(...args);
	}

	subscribeRoom(...args: any[]) {
		const { server } = reduxStore.getState();
		const { version: serverVersion } = server;
		const topic = 'stream-notify-room';
		let eventUserTyping;
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '4.0.0')) {
			eventUserTyping = this.subscribe(topic, `${args[0]}/user-activity`, ...args);
		} else {
			eventUserTyping = this.subscribe(topic, `${args[0]}/typing`, ...args);
		}

		// Taken from https://github.com/RocketChat/Rocket.Chat.js.SDK/blob/454b4ba784095057b8de862eb99340311b672e15/lib/drivers/ddp.ts#L555
		return Promise.all([
			this.subscribe('stream-room-messages', args[0], ...args),
			eventUserTyping,
			this.subscribe(topic, `${args[0]}/deleteMessage`, ...args)
		]);
	}

	unsubscribe(subscription: any[]) {
		return this.current.unsubscribe(subscription);
	}

	onStreamData(...args: any[]) {
		return this.current.onStreamData(...args);
	}
}

const sdk = new Sdk();

export default sdk;

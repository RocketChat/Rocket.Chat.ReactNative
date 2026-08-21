import { Rocketchat } from '@rocket.chat/sdk';
import { type ICallback, type ICurrentLogin, type ILoginCredentials, type ISubscription } from '@rocket.chat/sdk/interfaces';
import EJSON from 'ejson';
import isEmpty from 'lodash/isEmpty';

import { twoFactor } from './twoFactor';
import { isSsl } from '../methods/helpers/isSsl';
import { store as reduxStore } from '../store/auxStore';
import {
	type Serialized,
	type MatchPathPattern,
	type OperationParams,
	type PathFor,
	type ResultFor
} from '../../definitions/rest/helpers';
import { compareServerVersion, random } from '../methods/helpers';

export type TDriver = Rocketchat['driver'];

export type TStreamDataCallback = (ddpMessage: any) => void;

export interface IStreamDataListener {
	stop: () => void;
}

class Sdk {
	private sdk: Rocketchat | null = null;
	private code: any;

	private get activeSdk(): Rocketchat {
		if (!this.sdk) {
			throw new Error('Sdk is not initialized');
		}
		return this.sdk;
	}

	private initializeSdk(server: string): Rocketchat {
		// The app can't reconnect if reopen interval is 5s while in development
		return new Rocketchat({ host: server, protocol: 'ddp', useSsl: isSsl(server), reopen: __DEV__ ? 20000 : 5000 });
	}

	initialize(server: string): Rocketchat {
		this.code = null;
		this.sdk = this.initializeSdk(server);
		return this.sdk;
	}

	get host(): string | null {
		return this.sdk?.client?.host ?? null;
	}

	get currentLogin(): ICurrentLogin | null {
		return this.sdk?.currentLogin ?? null;
	}

	get driver(): TDriver | null {
		return this.sdk?.driver ?? null;
	}

	get isInitialized(): boolean {
		return this.sdk !== null;
	}

	async login(credentials: ILoginCredentials): Promise<ICurrentLogin | null> {
		const client = this.activeSdk;
		await client.login(credentials);
		return client.currentLogin ?? null;
	}

	abort() {
		return this.activeSdk.abort();
	}

	subscribeNotifyUser() {
		return this.activeSdk.subscribeNotifyUser();
	}

	disconnect(): void {
		if (this.sdk) {
			this.sdk.disconnect();
			this.sdk = null;
		}
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
		return this.activeSdk.get(endpoint, params);
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
				const result = await this.activeSdk.post(endpoint, params);

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
					} catch (twoFactorError) {
						return reject(twoFactorError);
					}
				} else {
					reject(e);
				}
			}
		});
	}

	del<TPath extends PathFor<'DELETE'>>(
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
		return this.activeSdk.del(endpoint, params);
	}

	logout() {
		return this.activeSdk.logout();
	}

	methodCall(method: string, ...args: any[]): Promise<any> {
		return new Promise(async (resolve, reject) => {
			try {
				// Clear the 2FA code after use — a stale trailing arg breaks typed method signatures
				const { code } = this;
				this.code = null;
				const result = await this.activeSdk.methodCall(method, ...args, ...(code ? [code] : []));
				return resolve(result);
			} catch (e: any) {
				if (e.error && (e.error === 'totp-required' || e.error === 'totp-invalid')) {
					const { details } = e;
					try {
						this.code = await twoFactor({ method: details?.method, invalid: e.error === 'totp-invalid' });
						return resolve(this.methodCall(method, ...args));
					} catch (twoFactorError) {
						return reject(twoFactorError);
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

	subscribe(topic: string, eventName?: string, ...args: any[]): Promise<ISubscription | undefined> {
		return this.activeSdk.subscribe(topic, eventName as string, ...args);
	}

	subscribeRaw(name: string, params: any[]): Promise<ISubscription | undefined> {
		return this.activeSdk.subscribeRaw(name, params);
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
			this.subscribe(topic, `${args[0]}/deleteMessage`, ...args),
			this.subscribe(topic, `${args[0]}/deleteMessageBulk`, ...args),
			this.subscribe(topic, `${args[0]}/messagesRead`, ...args)
		]);
	}

	unsubscribe(subscription: ISubscription) {
		return this.activeSdk.unsubscribe(subscription);
	}

	onStreamData(event: string, callback: TStreamDataCallback): Promise<IStreamDataListener> {
		return this.activeSdk.onStreamData(event, callback as ICallback);
	}
}

const sdk = new Sdk();

export default sdk;

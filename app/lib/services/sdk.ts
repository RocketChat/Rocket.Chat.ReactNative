import EJSON from 'ejson';
import isEmpty from 'lodash/isEmpty';
import { type ClientStream, DDPSDK } from '@rocket.chat/ddp-client';

import { twoFactor } from './twoFactor';
import { store as reduxStore } from '../store/auxStore';
import { compareServerVersion, random } from '../methods/helpers';
import log from '../methods/helpers/log';
import UserPreferences from '../methods/userPreferences';
import { headers as defaultHeaders } from '../methods/helpers/defaultHeaders';
import { BASIC_AUTH_KEY } from '../methods/helpers/fetch';
import {
	type Serialized,
	type MatchPathPattern,
	type OperationParams,
	type PathFor,
	type ResultFor
} from '../../definitions/rest/helpers';
import { type ILoginDataResponse, type ILoginResponse } from '../../definitions/rest/v1/auth';

export async function normalizeResponseError(response: Response): Promise<{ status: number; data: any }> {
	try {
		const data = await response.clone().json();
		return { status: response.status, data };
	} catch {
		return { status: response.status, data: {} };
	}
}

// Mirrors @rocket.chat/ddp-client's internal `ConnectionStatus`. It isn't exported by the package yet,
// so we keep a single source of truth here instead of repeating the union inline.
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed' | 'closed' | 'disconnected' | 'reconnecting';

export const NOTIFY_USER_EVENTS = [
	'message',
	'notification',
	'rooms-changed',
	'subscriptions-changed',
	'uiInteraction',
	'e2ekeyRequest',
	'userData',
	'video-conference',
	'media-signal',
	'media-calls'
] as const;

/**
 * Preserve the old-SDK call shape `sdk.current?.subscribeNotifyUser?.()` by
 * declaring the method on `DDPSDK`. The implementation lives on our `Sdk`
 * wrapper; `initialize()` glues it onto the DDPSDK instance at runtime.
 */
declare module '@rocket.chat/ddp-client' {
	interface DDPSDK {
		subscribeNotifyUser?: () => ReturnType<Sdk['subscribeNotifyUser']>;
	}
}

class Sdk {
	private sdk: DDPSDK | undefined;
	private serverUrl: string | undefined;
	private code: any = null;
	private headers: Record<string, string> = { ...defaultHeaders } as Record<string, string>;

	initialize(server: string): DDPSDK {
		this.code = null;
		this.headers = { ...defaultHeaders } as Record<string, string>;
		this.sdk = DDPSDK.create(server);

		this.sdk.subscribeNotifyUser = () => this.subscribeNotifyUser();
		this.serverUrl = server;
		this.loadBasicAuth();
		this.sdk.rest.handleTwoFactorChallenge(this.twoFactorHandler.bind(this));
		return this.sdk;
	}

	get server(): string | undefined {
		return this.serverUrl;
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
		this.serverUrl = undefined;
		return null;
	}

	probe(timeoutMs = 2000): Promise<boolean> {
		return this.current?.connection.probe(timeoutMs) ?? Promise.resolve(false);
	}

	forceReopen(): Promise<boolean> {
		return this.current?.connection.forceReopen() ?? Promise.resolve(false);
	}

	private loadBasicAuth(): void {
		const basicAuth = UserPreferences.getString(`${BASIC_AUTH_KEY}-${this.serverUrl}`);
		if (basicAuth) {
			this.setHeaders({ Authorization: `Basic ${basicAuth}` });
		}
	}

	private setHeaders(headers: Record<string, string>): void {
		this.headers = { ...this.headers, ...headers };
	}

	getHeaders(): Record<string, string> {
		return { ...this.headers };
	}

	setBasicAuth(basicAuth: string | null): void {
		const url = this.serverUrl;
		if (basicAuth) {
			if (url) {
				UserPreferences.setString(`${BASIC_AUTH_KEY}-${url}`, basicAuth);
			}
			this.setHeaders({ Authorization: `Basic ${basicAuth}` });
		} else {
			if (url) {
				UserPreferences.removeItem(`${BASIC_AUTH_KEY}-${url}`);
			}
			const next = { ...this.headers };
			delete next.Authorization;
			this.headers = next;
		}
	}

	async get<TPath extends PathFor<'GET'>>(
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
		try {
			// @ts-ignore
			return await sdk.rest.get(endpoint, params, {
				headers: this.headers
			});
		} catch (e: any) {
			throw e instanceof Response ? await normalizeResponseError(e) : e;
		}
	}

	async post<TPath extends PathFor<'POST'>>(
		endpoint: TPath,
		params: void extends OperationParams<'POST', MatchPathPattern<TPath>>
			? void
			: Serialized<OperationParams<'POST', MatchPathPattern<TPath>>> = undefined as void extends OperationParams<
			'POST',
			MatchPathPattern<TPath>
		>
			? void
			: Serialized<OperationParams<'POST', MatchPathPattern<TPath>>>,
		extraHeaders: Record<string, string> = {}
	): Promise<ResultFor<'POST', MatchPathPattern<TPath>>> {
		const isMethodCall = !!endpoint?.includes('/v1/method.call');
		try {
			const sdk = this.ensureInitialized();
			// @ts-ignore
			const result = await sdk.rest.post(endpoint, params, { headers: { ...this.headers, ...extraHeaders } });

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
				return response.result;
			}
			return result;
		} catch (e: any) {
			// @rocket.chat/api-client rejects with the raw fetch Response on transport failures (network/5xx),
			// for both REST and method calls. Normalize it so callers can read e.data.* (REST) or e.error/e.reason
			// (method call, which is flat, matching the shape already thrown for method-call business errors above).
			const normalizedResponse = e instanceof Response ? await normalizeResponseError(e) : null;
			const normalized = isMethodCall ? normalizedResponse?.data ?? e : normalizedResponse ?? e;
			const errorType = isMethodCall ? normalized?.error : normalized?.data?.errorType;
			const totpInvalid = 'totp-invalid';
			const totpRequired = 'totp-required';
			if ([totpInvalid, totpRequired].includes(errorType)) {
				const { details } = isMethodCall ? normalized : normalized?.data;
				try {
					const totpResult = await twoFactor({ method: details?.method, invalid: errorType === totpInvalid });
					// Recurse so a retry that itself gets challenged again keeps using per-call headers,
					// without ever touching the shared `this.headers`.
					return await this.post(endpoint, params, {
						'x-2fa-code': totpResult.twoFactorCode,
						'x-2fa-method': totpResult.twoFactorMethod
					});
				} catch {
					// twoFactor was canceled
					return {} as ResultFor<'POST', MatchPathPattern<TPath>>;
				}
			} else {
				throw normalized;
			}
		}
	}

	async delete<TPath extends PathFor<'DELETE'>>(
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
		try {
			// @ts-ignore
			return await sdk.rest.delete(endpoint, params, {
				headers: this.headers
			});
		} catch (e: any) {
			throw e instanceof Response ? await normalizeResponseError(e) : e;
		}
	}

	async twoFactorHandler({
		method,
		invalidAttempt
	}: {
		method: 'totp' | 'email' | 'password';
		invalidAttempt?: boolean;
	}): Promise<string> {
		const result = await twoFactor({ method, invalid: !!invalidAttempt });
		return result.twoFactorCode;
	}

	async login(credentials: any): Promise<ILoginDataResponse> {
		try {
			const { server } = this;
			const loginResult = (await this.post('/v1/login', credentials)) as unknown as ILoginResponse;
			if (loginResult?.status !== 'success' || !loginResult.data) {
				return Promise.reject(new Error('Invalid response from server'));
			}
			// Auth is tracked in two places, both required: loginWithToken() sets the DDP-level session used
			// by methodCall()/subscribe(), while setHeaders() below sets the REST-level auth used by get/post/delete.
			// Another server may have been selected while the REST login was in flight — applying this token
			// to the wrong sdk instance would authenticate server A's credentials on server B's connection.
			if (this.server !== server) {
				return Promise.reject(new Error('Server switched during login'));
			}
			await this.current?.account.loginWithToken(loginResult.data.authToken);

			this.setHeaders({
				'X-Auth-Token': loginResult.data.authToken,
				'X-User-Id': loginResult.data.userId
			});

			return loginResult.data;
		} catch (e: any) {
			if (e instanceof Response) {
				return Promise.reject(await normalizeResponseError(e));
			}
			return Promise.reject(e);
		}
	}

	async methodCall(...args: any[]): Promise<any> {
		try {
			if (!this.current || !this.current.client) {
				throw new Error('SDK not initialized');
			}
			const [method, ...params] = args;
			const result = await this.current.client.callAsyncWithOptions(method, {}, ...params, ...(this.code ? [this.code] : []));
			// Clear the 2FA code after use — a stale trailing arg breaks typed method signatures on the next call.
			if (this.code) {
				this.code = null;
			}
			return result;
		} catch (e: any) {
			if (e.error && (e.error === 'totp-required' || e.error === 'totp-invalid')) {
				const { details } = e;
				try {
					this.code = await twoFactor({ method: details?.method, invalid: e.error === 'totp-invalid' });
					const result = await this.methodCall(...args);
					this.code = null;
					return result;
				} catch {
					// twoFactor was canceled
					this.code = null;
					return {};
				}
			} else {
				throw e;
			}
		}
	}

	methodCallWrapper(method: string, ...params: any[]): Promise<any> {
		const { API_Use_REST_For_DDP_Calls } = reduxStore.getState().settings;
		const { user } = reduxStore.getState().login;
		if (API_Use_REST_For_DDP_Calls) {
			const url = isEmpty(user) ? 'method.callAnon' : 'method.call';
			const endpoint = `/v1/${url}/${method}` as PathFor<'POST'>;
			return this.post(endpoint, {
				message: EJSON.stringify({ msg: 'method', id: random(10), method, params })
			} as any);
		}
		const parsedParams = params.map(param => {
			if (param instanceof Date) {
				return { $date: new Date(param).getTime() };
			}
			return param;
		});
		return this.methodCall(method, ...parsedParams);
	}

	subscribe(...args: Parameters<ClientStream['subscribe']>) {
		return this.ensureInitialized().client.subscribe(...args);
	}

	subscribeRoom(rid: string): Promise<any[]> {
		const subscriptions: any[] = [];
		if (!this.current) {
			return Promise.resolve(subscriptions);
		}
		try {
			const { version: serverVersion } = reduxStore.getState().server;
			const topic = 'stream-notify-room';
			const typingEvent = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '4.0.0') ? 'user-activity' : 'typing';
			subscriptions.push(this.current.client.subscribe('stream-room-messages', rid));
			subscriptions.push(this.current.client.subscribe(topic, `${rid}/${typingEvent}`));
			subscriptions.push(this.current.client.subscribe(topic, `${rid}/deleteMessage`));
			subscriptions.push(this.current.client.subscribe(topic, `${rid}/deleteMessageBulk`));
			subscriptions.push(this.current.client.subscribe(topic, `${rid}/messagesRead`));
			return Promise.resolve(subscriptions);
		} catch (e) {
			log(e);
			return Promise.resolve(subscriptions);
		}
	}

	onCollection(...args: Parameters<ClientStream['onCollection']>) {
		return this.current?.client.onCollection(...args);
	}

	onStreamData(name: string, callback: (...data: any) => void): Promise<{ stop: () => void }> {
		return new Promise(resolve => {
			if (!this.current) {
				resolve({ stop: () => {} });
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

	onConnectionStatus(callback: (status: ConnectionStatus) => void): () => void {
		if (!this.current) {
			return () => {};
		}
		return this.current.connection.on('connection', callback);
	}

	/**
	 * Fires once re-authentication actually completes (uid set), not on raw socket 'connected' -
	 * ddp-client's own reconnect handler calls account.loginWithToken() without awaiting it, so
	 * subscribing on 'connected' races the login and gets rejected (nosub) by the server.
	 */
	onLogin(callback: () => void): () => void {
		if (!this.current) {
			return () => {};
		}
		return this.current.account.on('uid', uid => {
			if (uid) {
				callback();
			}
		});
	}

	stream(...args: Parameters<DDPSDK['stream']>) {
		return this.current?.stream(...args);
	}

	/**
	 * Re-subscribe to the per-user `stream-notify-user` channels needed for VoIP,
	 * notifications, and presence. Used after `forceReopen()` — once the socket
	 * is rebuilt, any prior subscriptions are server-side stale and must be
	 * re-established or the user receives no signals (incoming call answers,
	 * messages, etc.) until the next full saga re-run.
	 *
	 * Ports the old SDK's `subscribeNotifyUser()` helper. Returns an empty array
	 * when there is no current SDK or no logged-in user.
	 */
	subscribeNotifyUser(userId?: string) {
		const client = this.current?.client;
		const uid = userId ?? this.current?.account.user?.id;
		if (!client || !uid) {
			return [];
		}
		return NOTIFY_USER_EVENTS.map(event => client.subscribe('stream-notify-user', `${uid}/${event}`));
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
		const next = { ...this.headers };
		delete next['X-Auth-Token'];
		delete next['X-User-Id'];
		try {
			if (this.current?.account) {
				const TIMEOUT = Symbol('logout-timeout');
				// account.logout() can hang indefinitely on a dead socket; cap it so app-level logout always completes.
				const result = await Promise.race([
					this.current.account.logout(),
					new Promise<typeof TIMEOUT>(resolve => setTimeout(() => resolve(TIMEOUT), 5000))
				]);
				if (result === TIMEOUT) {
					log(new Error('Sdk.logout(): account.logout() timed out after 5s; server session may still be valid'));
				}
			}
		} catch (e) {
			log(e);
		} finally {
			// Always clear auth headers, even if logout throws — otherwise stale X-Auth-Token/X-User-Id leak into later calls.
			this.headers = next;
		}
	}
}

const sdk = new Sdk();

export default sdk;

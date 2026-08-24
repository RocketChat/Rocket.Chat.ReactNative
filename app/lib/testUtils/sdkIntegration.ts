import type * as RocketChatSdk from '@rocket.chat/sdk';
import type { Store } from 'redux';

import type { IApplicationState } from '../../definitions';
import type sdk from '../services/sdk';
import type { ISocketDriver } from '../services/sdk';

export interface IDdpMessage {
	msg: string;
	id?: string;
	name?: string;
	method?: string;
	params?: unknown[];
}

export class MockConnection {
	send = jest.fn((frame: string) => {
		const message = JSON.parse(frame) as IDdpMessage;
		if (message.msg === 'connect') {
			setImmediate(() => this.onmessage({ data: JSON.stringify({ msg: 'connected', session: 'session-id' }) }));
		} else if (message.msg === 'ping') {
			setImmediate(() => this.onmessage({ data: JSON.stringify({ msg: 'pong' }) }));
		} else if (message.msg === 'sub') {
			setImmediate(() => this.onmessage({ data: JSON.stringify({ msg: 'ready', subs: [message.id] }) }));
		} else if (message.msg === 'unsub') {
			setImmediate(() => this.onmessage({ data: JSON.stringify({ msg: 'nosub', id: message.id }) }));
		} else if (message.msg === 'method' && message.method === 'login') {
			setImmediate(() =>
				this.onmessage({
					data: JSON.stringify({ msg: 'result', id: message.id, result: { id: 'user-id', token: 'auth-token' } })
				})
			);
		}
	});

	close = jest.fn();
	readyState = 1;
	onopen = () => {};
	onmessage = (_event: { data: string }) => {};
	onerror = () => {};
	onclose = (_event?: { code?: number }) => {};

	constructor(registry: MockConnection[]) {
		registry.push(this);
	}
}

export interface ISdkDriver extends ISocketDriver {
	userId: string;
	pingInterval: number;
	socket: {
		lastPing: number;
		pingTimeout?: ReturnType<typeof setTimeout>;
		openTimeout?: ReturnType<typeof setTimeout>;
		open(): Promise<void>;
		send(message: Record<string, unknown>): Promise<unknown>;
		subscriptions: Record<string, { id: string; name: string; params: string[]; unsubscribe: jest.Mock }>;
	};
}

export interface IMockSdkClient {
	host?: string;
	driver?: ISocketDriver;
}

export type IMockSdk = Pick<typeof sdk, 'host' | 'driver' | 'isInitialized'> & {
	setClient(client: IMockSdkClient | null): void;
};

export type TSdkMockMembers = Partial<typeof sdk>;

export function makeSdkMock<TMembers extends TSdkMockMembers = Record<string, never>>(members?: TMembers): IMockSdk & TMembers {
	let client: IMockSdkClient | null = null;
	const mock: IMockSdk = {
		setClient(next: IMockSdkClient | null) {
			client = next;
		},
		get host() {
			return client?.host ?? null;
		},
		get driver() {
			return client?.driver ?? null;
		},
		get isInitialized() {
			return client !== null;
		}
	};
	return Object.assign(mock, members ?? ({} as TMembers));
}

export function latestConnection(connections: MockConnection[]): MockConnection {
	return connections[connections.length - 1];
}

export function framesOn(connection: MockConnection, msg: string): IDdpMessage[] {
	return connection.send.mock.calls
		.map(([frame]: [string]) => JSON.parse(frame) as IDdpMessage)
		.filter(message => message.msg === msg);
}

export function receiveFrame(connection: MockConnection, frame: Record<string, unknown>): void {
	connection.onmessage({ data: JSON.stringify(frame) });
}

const { Rocketchat } = jest.requireActual<typeof RocketChatSdk>('@rocket.chat/sdk');

const driverLogger = { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() };

export async function buildConnectedDriver(connections: MockConnection[], userId: string): Promise<ISdkDriver> {
	const driver = new Rocketchat({ host: 'localhost:3000', logger: driverLogger }).driver as unknown as ISdkDriver;
	driver.userId = userId;
	const openPromise = driver.socket.open();
	connections[0].onopen();
	await jest.advanceTimersByTimeAsync(0);
	await openPromise;
	return driver;
}

export function addMediaSubs(driver: ISdkDriver, userId: string): void {
	['media-signal', 'media-calls'].forEach((name, index) => {
		const id = `sub-${index}`;
		driver.socket.subscriptions[id] = {
			id,
			name: 'stream-notify-user',
			params: [`${userId}/${name}`],
			unsubscribe: jest.fn()
		};
	});
}

export function backdateLastPing(driver: ISdkDriver, ageMs: number): void {
	driver.socket.lastPing = Date.now() - ageMs;
}

export function stopAnsweringFrames(connection: MockConnection): void {
	connection.send.mockImplementation(() => undefined);
}

export interface IMockCollection {
	name: string;
	find: jest.Mock;
	query: jest.Mock;
	create: jest.Mock;
	prepareCreate: jest.Mock;
	schema: Record<string, unknown>;
}

export function makeCollection(name: string): IMockCollection {
	return {
		name,
		find: jest.fn(),
		query: jest.fn(() => ({ fetch: jest.fn(() => Promise.resolve([])) })),
		create: jest.fn(),
		prepareCreate: jest.fn(),
		schema: {}
	};
}

export async function flush(turns = 10): Promise<void> {
	for (let i = 0; i < turns; i++) {
		await Promise.resolve();
		await jest.advanceTimersByTimeAsync(0);
	}
}

export async function settleUntil(isSettled: () => boolean, maxRounds = 20): Promise<void> {
	for (let round = 0; round < maxRounds && !isSettled(); round++) {
		await jest.runOnlyPendingTimersAsync();
		await flush();
	}
}

export interface IMockReduxState {
	meteor: { connected: boolean };
	login: { user: Record<string, unknown> | null; isAuthenticated: boolean };
	server: { version: string };
	settings: Record<string, unknown>;
	room: { subscribedRoom: string | null };
}

export interface IMockReduxStore {
	state: IMockReduxState;
	store: Store<IApplicationState> & { dispatch: jest.Mock };
}

export function makeReduxStore(): IMockReduxStore {
	const listeners = new Set<() => void>();
	const state: IMockReduxState = {
		meteor: { connected: false },
		login: { user: null, isAuthenticated: false },
		server: { version: '5.0.0' },
		settings: {},
		room: { subscribedRoom: null }
	};
	return {
		state,
		store: {
			getState: () => state,
			dispatch: jest.fn(),
			subscribe: (listener: () => void) => {
				listeners.add(listener);
				return () => listeners.delete(listener);
			}
		} as unknown as Store<IApplicationState> & { dispatch: jest.Mock }
	};
}

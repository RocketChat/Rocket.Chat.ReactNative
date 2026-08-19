import type { Store } from 'redux';

import type { IApplicationState } from '../../definitions';

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

export interface ISdkDriver {
	userId: string;
	pingInterval: number;
	reopenNow(): Promise<void>;
	waitForNotifyUserMediaSubs?(timeoutMs?: number): Promise<boolean>;
	socket: {
		lastPing: number;
		pingTimeout?: ReturnType<typeof setTimeout>;
		openTimeout?: ReturnType<typeof setTimeout>;
		open(): Promise<void>;
		send(message: Record<string, unknown>): Promise<unknown>;
		subscriptions: Record<string, { id: string; name: string; params: string[]; unsubscribe: jest.Mock }>;
	};
}

export function framesOn(connection: MockConnection, msg: string): IDdpMessage[] {
	return connection.send.mock.calls
		.map(([frame]: [string]) => JSON.parse(frame) as IDdpMessage)
		.filter(message => message.msg === msg);
}

export function receiveFrame(connection: MockConnection, frame: Record<string, unknown>): void {
	connection.onmessage({ data: JSON.stringify(frame) });
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Driver } = require('@rocket.chat/sdk/lib/drivers/driver') as {
	Driver: new (options: { host: string; logger: unknown }) => ISdkDriver;
};

const driverLogger = { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() };

export async function buildConnectedDriver(connections: MockConnection[], userId: string): Promise<ISdkDriver> {
	const driver = new Driver({ host: 'localhost:3000', logger: driverLogger });
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

export function makeCollection(name: string) {
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

export function makeReduxStore() {
	const listeners = new Set<() => void>();
	const state = {
		meteor: { connected: false },
		login: { user: null as Record<string, unknown> | null, isAuthenticated: false },
		server: { version: '5.0.0' },
		settings: {} as Record<string, unknown>,
		room: { subscribedRoom: null as string | null }
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

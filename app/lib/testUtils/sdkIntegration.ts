import type { Store } from 'redux';

import type { IApplicationState } from '../../definitions';

export interface DdpMessage {
	msg: string;
	id?: string;
	name?: string;
	method?: string;
	params?: unknown[];
}

export class MockConnection {
	send = jest.fn((data: string) => {
		const message = JSON.parse(data) as DdpMessage;
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

export interface SdkDriver {
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

export function framesOn(connection: MockConnection, msg: string): DdpMessage[] {
	return connection.send.mock.calls
		.map(([data]: [string]) => JSON.parse(data) as DdpMessage)
		.filter(message => message.msg === msg);
}

export function receiveFrame(connection: MockConnection, frame: Record<string, unknown>): void {
	connection.onmessage({ data: JSON.stringify(frame) });
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

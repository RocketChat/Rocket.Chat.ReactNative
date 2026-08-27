import type { Store } from 'redux';

import type { IApplicationState } from '../../definitions';

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

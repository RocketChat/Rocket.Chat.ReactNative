import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import { useSubscriptions } from './useSubscriptions';

let queryCallCount = 0;

jest.mock('../../lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({
				query: () => ({
					observeWithColumns: () => {
						queryCallCount += 1;
						return {
							subscribe: (cb: (data: any[]) => void) => {
								cb([]);
								return { unsubscribe: jest.fn() };
							}
						};
					}
				})
			})
		}
	}
}));

const baseState = {
	server: { server: 'https://open.rocket.chat', connecting: false, loading: false, connected: true },
	settings: { UI_Use_Real_Name: false },
	sortPreferences: { sortBy: 'activity', showUnread: false, showFavorites: false, groupByType: false },
	login: { user: { roles: [] } }
};

const rootReducer = (state: any = baseState, action: any) =>
	action.type === 'UPDATE_SERVER' ? { ...state, server: action.server } : state;

const Harness = () => {
	useSubscriptions();
	return null;
};

describe('useSubscriptions', () => {
	it('does not re-query on connection state changes', async () => {
		const store = createStore(rootReducer, baseState);

		render(
			<Provider store={store}>
				<Harness />
			</Provider>
		);

		await waitFor(() => {
			expect(queryCallCount).toBeGreaterThanOrEqual(1);
		});
		const initialCalls = queryCallCount;

		await act(async () => {
			store.dispatch({
				type: 'UPDATE_SERVER',
				server: { server: 'https://open.rocket.chat', connecting: true, loading: false, connected: false }
			});
		});

		await act(async () => {
			store.dispatch({
				type: 'UPDATE_SERVER',
				server: { server: 'https://open.rocket.chat', connecting: false, loading: true, connected: false }
			});
		});

		await waitFor(() => {
			expect(queryCallCount).toBe(initialCalls);
		});
	});
});

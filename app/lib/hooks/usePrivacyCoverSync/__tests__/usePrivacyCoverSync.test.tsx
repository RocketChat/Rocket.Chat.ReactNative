import { act, renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { BehaviorSubject } from 'rxjs';
import type { ReactNode } from 'react';

const mockServerRecords = new BehaviorSubject<{ autoLock: boolean }[]>([]);

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: () => ({
				query: () => ({ observeWithColumns: () => mockServerRecords })
			})
		}
	}
}));

import { appStart } from '~/actions/app';
import { loginRequest, loginSuccess } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { RootEnum } from '~/definitions/redux/TRootEnum';
import NativePrivacyCover from '~/lib/native/NativePrivacyCover';
import reducers from '~/reducers';
import { usePrivacyCoverSync } from '..';

const setEnabled = jest.mocked(NativePrivacyCover.setEnabled);

const renderSignedInWithScreenLock = () => {
	const store = createStore(reducers);
	store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
	store.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', name: 'open', version: '7.0.0' }));
	store.dispatch(loginSuccess({ id: 'user-1', token: 'token-abc' } as never));
	mockServerRecords.next([{ autoLock: true }]);
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	renderHook(() => usePrivacyCoverSync(), { wrapper: Wrapper });
	return store;
};

const latestEnabled = () => setEnabled.mock.lastCall?.[0];

beforeEach(() => {
	jest.clearAllMocks();
});

it('enables the cover inside the app when screen lock is on', () => {
	renderSignedInWithScreenLock();

	expect(latestEnabled()).toBe(true);
});

it('keeps the cover enabled while a reconnect logs in again', () => {
	const store = renderSignedInWithScreenLock();
	setEnabled.mockClear();

	act(() => {
		store.dispatch(loginRequest({ resume: 'token-abc' }));
	});

	expect(setEnabled).not.toHaveBeenCalledWith(false);
});

it('disables the cover when screen lock is turned off', () => {
	renderSignedInWithScreenLock();

	act(() => {
		mockServerRecords.next([{ autoLock: false }]);
	});

	expect(latestEnabled()).toBe(false);
});

it('disables the cover outside the signed-in area', () => {
	const store = renderSignedInWithScreenLock();

	act(() => {
		store.dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
	});

	expect(latestEnabled()).toBe(false);
});

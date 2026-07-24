jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(() => Promise.resolve()),
	saveLastLocalAuthenticationSession: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/services/connect', () => ({
	checkAndReopen: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/services/restApi', () => ({
	setUserPresenceOnline: jest.fn(() => Promise.resolve()),
	setUserPresenceAway: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/notifications', () => ({
	checkPendingNotification: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

import { put } from 'redux-saga/effects';

import { RootEnum } from '../../definitions';
import { loginRequest } from '../../actions/login';
import { checkAndReopen } from '../../lib/services/connect';
import { appHasComeBackToForeground } from '../state';

// Manual saga-test style (no redux-saga-test-plan): drive the generator by feeding each
// `select` result and inspecting the yielded effects. Enters at ROOT_INSIDE for every case.
describe('state saga — appHasComeBackToForeground resume gate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('dispatches loginRequest({ resume }) when inside root, unauthenticated, token present', () => {
		const gen = appHasComeBackToForeground();
		gen.next(); // yields select(app.root)
		gen.next(RootEnum.ROOT_INSIDE); // yields select(login)
		const effect = gen.next({ isAuthenticated: false, user: { token: 'tok' } }).value;

		expect(effect).toEqual(put(loginRequest({ resume: 'tok' })));
		expect(gen.next().done).toBe(true);
	});

	it('bails without dispatching when unauthenticated and no token', () => {
		const gen = appHasComeBackToForeground();
		gen.next();
		gen.next(RootEnum.ROOT_INSIDE);
		const result = gen.next({ isAuthenticated: false, user: null });

		expect(result.done).toBe(true);
		expect(result.value).toBeUndefined();
	});

	it('runs the authenticated reopen path with no redundant resume', () => {
		const gen = appHasComeBackToForeground();
		gen.next();
		gen.next(RootEnum.ROOT_INSIDE);

		const values: unknown[] = [];
		let result = gen.next({ isAuthenticated: true, user: { token: 'tok' } });
		while (!result.done) {
			values.push(result.value);
			result = gen.next(undefined);
		}

		expect(checkAndReopen).toHaveBeenCalledTimes(1);
		expect(values).not.toContainEqual(put(loginRequest({ resume: 'tok' })));
	});
});

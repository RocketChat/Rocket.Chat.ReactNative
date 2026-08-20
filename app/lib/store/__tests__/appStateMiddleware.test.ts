jest.mock('react-native', () => ({
	AppState: {
		currentState: 'unknown',
		addEventListener: jest.fn()
	}
}));

jest.mock('../../notifications', () => ({
	removeNotificationsAndBadge: jest.fn(() => Promise.resolve())
}));

import { AppState } from 'react-native';

import applyAppStateMiddleware from '../appStateMiddleware';
import { APP_STATE } from '../../../actions/actionsTypes';

function setupStore() {
	const dispatch = jest.fn();
	const createStore = jest.fn(() => ({ dispatch }));
	applyAppStateMiddleware()(createStore)();
	const [, notifyAppState] = (AppState.addEventListener as jest.Mock).mock.calls[0];
	jest.runOnlyPendingTimers();
	dispatch.mockClear();
	return { dispatch, notifyAppState };
}

function dispatchedTypes(dispatch: jest.Mock) {
	return dispatch.mock.calls.map(([action]) => action.type);
}

describe('app state changes', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('tells the app it came to the foreground', () => {
		const { dispatch, notifyAppState } = setupStore();

		notifyAppState('active');

		expect(dispatchedTypes(dispatch)).toEqual([APP_STATE.FOREGROUND]);
	});

	it('tells the app it went to the background', () => {
		const { dispatch, notifyAppState } = setupStore();

		notifyAppState('background');

		expect(dispatchedTypes(dispatch)).toEqual([APP_STATE.BACKGROUND]);
	});

	it('stays silent while the app is only temporarily interrupted', () => {
		const { dispatch, notifyAppState } = setupStore();

		notifyAppState('inactive');

		expect(dispatchedTypes(dispatch)).toEqual([]);
	});

	it('keeps the foreground state through a temporary interruption', () => {
		const { dispatch, notifyAppState } = setupStore();

		notifyAppState('active');
		notifyAppState('inactive');
		notifyAppState('active');

		expect(dispatchedTypes(dispatch)).toEqual([APP_STATE.FOREGROUND]);
	});

	it('does not repeat the state already in effect', () => {
		const { dispatch, notifyAppState } = setupStore();

		notifyAppState('background');
		notifyAppState('background');
		notifyAppState('active');
		notifyAppState('active');

		expect(dispatchedTypes(dispatch)).toEqual([APP_STATE.BACKGROUND, APP_STATE.FOREGROUND]);
	});
});

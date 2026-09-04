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

function bootMiddleware(): { dispatch: jest.Mock; notifyAppState: (state: string) => void } {
	const dispatch = jest.fn();
	const createStore = jest.fn(() => ({ dispatch }));
	applyAppStateMiddleware()(createStore)();
	const [, notifyAppState] = (AppState.addEventListener as jest.Mock).mock.calls[0];
	jest.runOnlyPendingTimers();
	return { dispatch, notifyAppState };
}

function dispatchedTypes(dispatch: jest.Mock): string[] {
	return dispatch.mock.calls.map(([action]) => action.type);
}

describe('appStateMiddleware', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		AppState.currentState = 'unknown';
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('reports the state the app booted into', () => {
		AppState.currentState = 'active';

		const { dispatch } = bootMiddleware();

		expect(dispatchedTypes(dispatch)).toEqual([APP_STATE.FOREGROUND]);
	});

	it('stays quiet when the app boots into an unknown state', () => {
		AppState.currentState = 'unknown';

		const { dispatch } = bootMiddleware();

		expect(dispatchedTypes(dispatch)).toEqual([]);
	});

	it('tells the app it came to the foreground', () => {
		const { dispatch, notifyAppState } = bootMiddleware();

		notifyAppState('active');

		expect(dispatchedTypes(dispatch)).toEqual([APP_STATE.FOREGROUND]);
	});

	it('tells the app it went to the background', () => {
		const { dispatch, notifyAppState } = bootMiddleware();

		notifyAppState('background');

		expect(dispatchedTypes(dispatch)).toEqual([APP_STATE.BACKGROUND]);
	});

	it('keeps the foreground state through a temporary interruption', () => {
		const { dispatch, notifyAppState } = bootMiddleware();

		notifyAppState('active');
		notifyAppState('inactive');
		notifyAppState('active');

		expect(dispatchedTypes(dispatch)).toEqual([APP_STATE.FOREGROUND]);
	});

	it('does not repeat the state already in effect', () => {
		const { dispatch, notifyAppState } = bootMiddleware();

		notifyAppState('background');
		notifyAppState('background');
		notifyAppState('active');
		notifyAppState('active');

		expect(dispatchedTypes(dispatch)).toEqual([APP_STATE.BACKGROUND, APP_STATE.FOREGROUND]);
	});
});

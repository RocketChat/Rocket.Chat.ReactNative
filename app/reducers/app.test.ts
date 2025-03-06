import { appStart, appInit, setMasterDetail, setNotificationPresenceCap, appReady } from '../actions/app';
import { initialState } from './app';
import { mockedStore } from './mockedStore';
import { RootEnum } from '../definitions';
import { APP_STATE } from '../actions/actionsTypes';

describe('test reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().app;
		expect(state).toEqual(initialState);
	});

	it('should return root state after dispatch appStart action', () => {
		mockedStore.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		const { root } = mockedStore.getState().app;
		expect(root).toEqual(RootEnum.ROOT_INSIDE);
	});

	it('should return ready state after dispatch appInit action', () => {
		mockedStore.dispatch(appInit());
		const { ready } = mockedStore.getState().app;
		expect(ready).toEqual(false);
		mockedStore.dispatch(appReady());
		const { ready: ready2 } = mockedStore.getState().app;
		expect(ready2).toEqual(true);
	});

	it('should return ready state after dispatch setMasterDetail action', () => {
		mockedStore.dispatch(setMasterDetail(false));
		const { isMasterDetail } = mockedStore.getState().app;
		expect(isMasterDetail).toEqual(false);
	});

	it('should return correct state after app go to foreground', () => {
		mockedStore.dispatch({ type: APP_STATE.FOREGROUND });
		const { foreground, background } = mockedStore.getState().app;
		expect(foreground).toEqual(true);
		expect(background).toEqual(false);
	});

	it('should return correct state after app go to background', () => {
		mockedStore.dispatch({ type: APP_STATE.BACKGROUND });
		const { foreground, background } = mockedStore.getState().app;
		expect(foreground).toEqual(false);
		expect(background).toEqual(true);
	});

	it('should return correct state after dispatch setNotificationPresenceCap action', () => {
		mockedStore.dispatch(setNotificationPresenceCap(true));
		const { notificationPresenceCap } = mockedStore.getState().app;
		expect(notificationPresenceCap).toEqual(true);
		mockedStore.dispatch(setNotificationPresenceCap(false));
		const { notificationPresenceCap: notificationPresenceCap2 } = mockedStore.getState().app;
		expect(notificationPresenceCap2).toEqual(false);
	});
});

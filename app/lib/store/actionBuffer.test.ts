import { applyMiddleware, createStore } from 'redux';

import { actionBuffer } from './actionBuffer';

const trivialReducer = (state = {}, _action: any) => state;

const makeStore = () => createStore(trivialReducer, applyMiddleware(actionBuffer()));

beforeEach(() => {
	(global as any).__reduxActions = undefined;
});

describe('actionBuffer middleware', () => {
	it('records the dispatched action type in global.__reduxActions', () => {
		const store = makeStore();
		store.dispatch({ type: 'TEST_ACTION' });
		const buf: any[] = (global as any).__reduxActions;
		expect(buf).toBeDefined();
		expect(buf[buf.length - 1].type).toBe('TEST_ACTION');
	});

	it('caps the buffer at 100 and drops the oldest entry (FIFO)', () => {
		const store = makeStore();
		for (let i = 0; i < 110; i++) {
			store.dispatch({ type: `ACTION_${i}` });
		}
		const buf: any[] = (global as any).__reduxActions;
		expect(buf.length).toBe(100);
		expect(buf[0].type).toBe('ACTION_10');
		expect(buf[99].type).toBe('ACTION_109');
	});

	it('writes nothing to the console', () => {
		const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
		const groupSpy = jest.spyOn(console, 'group').mockImplementation(() => {});
		const groupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation(() => {});

		const store = makeStore();
		store.dispatch({ type: 'SILENT_ACTION' });

		expect(logSpy).not.toHaveBeenCalled();
		expect(infoSpy).not.toHaveBeenCalled();
		expect(groupSpy).not.toHaveBeenCalled();
		expect(groupEndSpy).not.toHaveBeenCalled();

		logSpy.mockRestore();
		infoSpy.mockRestore();
		groupSpy.mockRestore();
		groupEndSpy.mockRestore();
	});
});

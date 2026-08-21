import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import type { Saga, Task } from 'redux-saga';

import reducers from '../../reducers';

export async function flushSagaMicrotasks(): Promise<void> {
	for (let i = 0; i < 20; i += 1) {
		await new Promise(resolve => setImmediate(resolve));
	}
}

export function createRecordingStore(rootSaga: Saga, preloadedState?: Parameters<typeof createStore>[1]) {
	const dispatched: Record<string, any>[] = [];
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(
		reducers,
		preloadedState,
		applyMiddleware(
			() => next => action => {
				dispatched.push(action);
				return next(action);
			},
			sagaMiddleware
		)
	);
	const task: Task = sagaMiddleware.run(rootSaga);
	return { store, dispatched, task };
}

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import type { Saga, Task } from 'redux-saga';

import reducers from '../../reducers';

const MICROTASK_DRAIN_PASSES = 20;

export type PreloadedState = Parameters<typeof createStore>[1];

export async function flushSagaMicrotasks(): Promise<void> {
	for (let i = 0; i < MICROTASK_DRAIN_PASSES; i += 1) {
		await Promise.resolve();
	}
}

const runningTasks: Task[] = [];

export function cancelSagaTasks(): void {
	runningTasks.splice(0).forEach(task => task.cancel());
}

export function createRecordingStore(rootSaga: Saga, preloadedState?: PreloadedState) {
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
	runningTasks.push(task);
	return { store, dispatched, task };
}

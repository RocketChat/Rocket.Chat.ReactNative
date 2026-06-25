import { applyMiddleware, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../../reducers';
import sagas from '../../sagas';
import applyAppStateMiddleware from './appStateMiddleware';
import applyInternetStateMiddleware from './internetStateMiddleware';

let sagaMiddleware;
let enhancers;

if (__DEV__) {
	const reduxImmutableStateInvariant = require('redux-immutable-state-invariant').default();
	const { actionBuffer } = require('./actionBuffer');
	// Uncomment the next line (and the applyMiddleware(logger) line below) to print every action + next state to Metro.
	// const { logger } = require('./reduxLogger');

	sagaMiddleware = createSagaMiddleware();

	enhancers = compose(
		applyAppStateMiddleware(),
		applyInternetStateMiddleware(),
		applyMiddleware(reduxImmutableStateInvariant),
		applyMiddleware(sagaMiddleware),
		applyMiddleware(actionBuffer())
		// applyMiddleware(logger)
	);
} else {
	sagaMiddleware = createSagaMiddleware();
	enhancers = compose(applyAppStateMiddleware(), applyInternetStateMiddleware(), applyMiddleware(sagaMiddleware));
}

const store = createStore(reducers, enhancers);
sagaMiddleware.run(sagas);

if (__DEV__) {
	(global as any).reduxStore = store;
}

export default store;

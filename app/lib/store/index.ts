import { applyMiddleware, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../../reducers';
import sagas from '../../sagas';
import applyAppStateMiddleware from './appStateMiddleware';
import applyInternetStateMiddleware from './internetStateMiddleware';
import { logger } from './reduxLogger';

let sagaMiddleware;
let enhancers;

if (__DEV__) {
	const reduxImmutableStateInvariant = require('redux-immutable-state-invariant').default();
	sagaMiddleware = createSagaMiddleware();

	enhancers = compose(
		applyAppStateMiddleware(),
		applyInternetStateMiddleware(),
		applyMiddleware(reduxImmutableStateInvariant),
		applyMiddleware(sagaMiddleware)
		// applyMiddleware(logger)
	);
} else {
	sagaMiddleware = createSagaMiddleware();
	enhancers = compose(applyAppStateMiddleware(), applyInternetStateMiddleware(), applyMiddleware(sagaMiddleware));
}

const store = createStore(reducers, enhancers);
sagaMiddleware.run(sagas);

export default store;

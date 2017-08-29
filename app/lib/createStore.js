import 'babel-polyfill';
import 'regenerator-runtime/runtime';

import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import reducers from '../reducers';
import sagas from '../sagas';

const sagaMiddleware = createSagaMiddleware();
let middleware;

if (__DEV__) {
	/* eslint-disable global-require */
	const reduxImmutableStateInvariant = require('redux-immutable-state-invariant').default();
	middleware = [sagaMiddleware, reduxImmutableStateInvariant];
} else {
	middleware = [sagaMiddleware];
}

export default createStore(
	reducers,
	applyMiddleware(...middleware)
);
sagaMiddleware.run(sagas);

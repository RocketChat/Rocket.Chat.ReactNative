import 'babel-polyfill';
import 'regenerator-runtime/runtime';

import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import logger from 'redux-logger';
import rootReducer from '../reducers/rootReducer';
import helloSaga from '../sagas/hello';

const sagaMiddleware = createSagaMiddleware();
let middleware;

if (__DEV__) {
	/* eslint-disable global-require */
	const reduxImmutableStateInvariant = require('redux-immutable-state-invariant').default();
	middleware = [sagaMiddleware, reduxImmutableStateInvariant, logger];
} else {
	middleware = [sagaMiddleware];
}

export default createStore(
	rootReducer,
	applyMiddleware(sagaMiddleware)
);
sagaMiddleware.run(helloSaga);

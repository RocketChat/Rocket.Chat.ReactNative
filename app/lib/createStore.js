import 'babel-polyfill';
import 'regenerator-runtime/runtime';

import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { composeWithDevTools } from 'remote-redux-devtools';
import reducers from '../reducers';
import sagas from '../sagas';

const sagaMiddleware = createSagaMiddleware();
let enhacers;

if (__DEV__) {
	/* eslint-disable global-require */
	const reduxImmutableStateInvariant = require('redux-immutable-state-invariant').default();
	enhacers = composeWithDevTools(
		applyMiddleware(reduxImmutableStateInvariant),
		applyMiddleware(sagaMiddleware)
	);
} else {
	enhacers = composeWithDevTools(
		applyMiddleware(sagaMiddleware)
	);
}

const store = enhacers(createStore)(reducers);
sagaMiddleware.run(sagas);

if (module.hot && typeof module.hot.accept === 'function') {
	module.hot.accept(() => {
		store.replaceReducer(require('../reducers').default);
		sagaMiddleware.run(require('../sagas').default);
	});
}

export default store;

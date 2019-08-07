import { createStore, applyMiddleware, compose } from 'redux';
import Reactotron from 'reactotron-react-native';
import createSagaMiddleware from 'redux-saga';
import applyAppStateListener from 'redux-enhancer-react-native-appstate';

import reducers from '../reducers';
import sagas from '../sagas';

let sagaMiddleware;
let enhancers;

if (__DEV__) {
	/* eslint-disable global-require */
	const reduxImmutableStateInvariant = require('redux-immutable-state-invariant').default();
	sagaMiddleware = createSagaMiddleware({
		sagaMonitor: Reactotron.createSagaMonitor()
	});

	enhancers = compose(
		applyAppStateListener(),
		applyMiddleware(reduxImmutableStateInvariant),
		applyMiddleware(sagaMiddleware),
		Reactotron.createEnhancer()
	);
} else {
	sagaMiddleware = createSagaMiddleware();
	enhancers = compose(
		applyAppStateListener(),
		applyMiddleware(sagaMiddleware)
	);
}

const store = createStore(reducers, enhancers);
sagaMiddleware.run(sagas);

export default store;

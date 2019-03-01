import { createStore as reduxCreateStore, applyMiddleware, compose } from 'redux';
import Reactotron from 'reactotron-react-native';
import createSagaMiddleware from 'redux-saga';
import applyAppStateListener from 'redux-enhancer-react-native-appstate';

import reducers from '../reducers';
import sagas from '../sagas';

const createStore = __DEV__ ? Reactotron.createStore : reduxCreateStore;
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
		applyMiddleware(sagaMiddleware)
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

if (module.hot && typeof module.hot.accept === 'function') {
	module.hot.accept(() => {
		store.replaceReducer(require('../reducers').default);
		sagaMiddleware.run(require('../sagas').default);
	});
}

export default store;

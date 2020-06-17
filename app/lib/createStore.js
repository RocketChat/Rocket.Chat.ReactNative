import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../reducers';
import sagas from '../sagas';
import applyAppStateMiddleware from './appStateMiddleware';

let sagaMiddleware;
let enhancers;

if (__DEV__) {
	const reduxImmutableStateInvariant = require('redux-immutable-state-invariant').default();
	const Reactotron = require('reactotron-react-native').default;
	sagaMiddleware = createSagaMiddleware({
		sagaMonitor: Reactotron.createSagaMonitor()
	});

	enhancers = compose(
		applyAppStateMiddleware(),
		applyMiddleware(reduxImmutableStateInvariant),
		applyMiddleware(sagaMiddleware),
		Reactotron.createEnhancer()
	);
} else {
	sagaMiddleware = createSagaMiddleware();
	enhancers = compose(
		applyAppStateMiddleware(),
		applyMiddleware(sagaMiddleware)
	);
}

const store = createStore(reducers, enhancers);
sagaMiddleware.run(sagas);

export default store;

import { applyMiddleware, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import applyAppStateMiddleware from '../app/lib/appStateMiddleware';
import reducers from '../app/reducers';

const enhancers = compose(applyAppStateMiddleware(), applyMiddleware(createSagaMiddleware()));
export const mockedStore = createStore(reducers, enhancers);

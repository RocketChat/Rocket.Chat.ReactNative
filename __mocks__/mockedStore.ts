import { applyMiddleware, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../app/reducers';

const enhancers = compose(applyMiddleware(createSagaMiddleware()));
export const mockedStore = createStore(reducers, enhancers);

import { combineReducers } from 'redux';
import * as reducers from './reducers';
import * as login from './login';
import * as connect from './connect';

const rootReducer = combineReducers({
	...reducers, ...login, ...connect
});

export default rootReducer;

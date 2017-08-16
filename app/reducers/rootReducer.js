import { combineReducers } from 'redux';
import * as reducers from './reducers';
import * as login from './login';

const rootReducer = combineReducers({
	...reducers, ...login
});

export default rootReducer;

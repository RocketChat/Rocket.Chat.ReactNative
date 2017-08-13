import { combineReducers } from 'redux';
import * as reducers from './reducers';

const rootReducer = combineReducers({
	...reducers
});

export default rootReducer;

import { combineReducers } from 'redux';
import * as reducers from './reducers';
import login from './login';
import meteor from './connect';
import messages from './messages';
import server from './server';


export default combineReducers({
	...reducers, login, meteor, messages, server
});

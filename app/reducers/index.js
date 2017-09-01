import { combineReducers } from 'redux';
import settings from './reducers';
import login from './login';
import meteor from './connect';
import messages from './messages';
import server from './server';
import navigator from './navigator';
import createChannel from './createChannel';


export default combineReducers({
	settings, login, meteor, messages, server, navigator, createChannel
});

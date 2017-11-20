import { combineReducers } from 'redux';
import settings from './reducers';
import login from './login';
import meteor from './connect';
import messages from './messages';
import room from './room';
import server from './server';
import navigator from './navigator';
import createChannel from './createChannel';
import app from './app';


export default combineReducers({
	settings, login, meteor, messages, server, navigator, createChannel, app, room
});

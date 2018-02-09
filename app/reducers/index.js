import { combineReducers } from 'redux';
import settings from './reducers';
import login from './login';
import meteor from './connect';
import messages from './messages';
import room from './room';
import rooms from './rooms';
import server from './server';
import navigator from './navigator';
import createChannel from './createChannel';
import app from './app';
import permissions from './permissions';
import customEmojis from './customEmojis';
import activeUsers from './activeUsers';

export default combineReducers({
	settings,
	login,
	meteor,
	messages,
	server,
	navigator,
	createChannel,
	app,
	room,
	rooms,
	permissions,
	customEmojis,
	activeUsers
});

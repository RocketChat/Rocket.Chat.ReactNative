import { combineReducers } from 'redux';
import settings from './reducers';
import login from './login';
import meteor from './connect';
import messages from './messages';
import room from './room';
import rooms from './rooms';
import server from './server';
import selectedUsers from './selectedUsers';
import createChannel from './createChannel';
import app from './app';
import customEmojis from './customEmojis';
import activeUsers from './activeUsers';
import roles from './roles';
import sortPreferences from './sortPreferences';

export default combineReducers({
	settings,
	login,
	meteor,
	messages,
	server,
	selectedUsers,
	createChannel,
	app,
	room,
	rooms,
	customEmojis,
	activeUsers,
	roles,
	sortPreferences
});

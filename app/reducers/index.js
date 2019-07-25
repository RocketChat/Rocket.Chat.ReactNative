import { combineReducers } from 'redux';
import settings from './reducers';
import login from './login';
import meteor from './connect';
import messages from './messages';
import rooms from './rooms';
import server from './server';
import selectedUsers from './selectedUsers';
import createChannel from './createChannel';
import app from './app';
import sortPreferences from './sortPreferences';
import notification from './notification';
import markdown from './markdown';
import share from './share';

export default combineReducers({
	settings,
	login,
	meteor,
	messages,
	server,
	selectedUsers,
	createChannel,
	app,
	rooms,
	sortPreferences,
	notification,
	markdown,
	share
});

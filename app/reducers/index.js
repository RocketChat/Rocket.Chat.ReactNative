import { combineReducers } from 'redux';
import settings from './reducers';
import login from './login';
import meteor from './connect';
import rooms from './rooms';
import server from './server';
import selectedUsers from './selectedUsers';
import createChannel from './createChannel';
import app from './app';
import sortPreferences from './sortPreferences';
import notification from './notification';
import markdown from './markdown';
import share from './share';
import crashReport from './crashReport';
import customEmojis from './customEmojis';
import activeUsers from './activeUsers';
import usersTyping from './usersTyping';
import inviteLinks from './inviteLinks';

export default combineReducers({
	settings,
	login,
	meteor,
	server,
	selectedUsers,
	createChannel,
	app,
	rooms,
	sortPreferences,
	notification,
	markdown,
	share,
	crashReport,
	customEmojis,
	activeUsers,
	usersTyping,
	inviteLinks
});

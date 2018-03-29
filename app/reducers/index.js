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
import roles from './roles';
import starredMessages from './starredMessages';
import pinnedMessages from './pinnedMessages';
import mentionedMessages from './mentionedMessages';
import snippetedMessages from './snippetedMessages';
import roomFiles from './roomFiles';

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
	activeUsers,
	roles,
	starredMessages,
	pinnedMessages,
	mentionedMessages,
	snippetedMessages,
	roomFiles
});

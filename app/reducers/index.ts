import { combineReducers } from 'redux';

import inquiry from '../ee/omnichannel/reducers/inquiry';
import settings from './settings';
import login from './login';
import meteor from './connect';
import room from './room';
import rooms from './rooms';
import server from './server';
import selectedUsers from './selectedUsers';
import createChannel from './createChannel';
import app from './app';
import sortPreferences from './sortPreferences';
import share from './share';
import customEmojis from './customEmojis';
import activeUsers from './activeUsers';
import usersTyping from './usersTyping';
import inviteLinks from './inviteLinks';
import createDiscussion from './createDiscussion';
import enterpriseModules from './enterpriseModules';
import encryption from './encryption';
import permissions from './permissions';
import roles from './roles';
import videoConf from './videoConf';
import usersRoles from './usersRoles';
import troubleshootingNotification from './troubleshootingNotification';
import supportedVersions from './supportedVersions';
import inAppFeedback from './inAppFeedback';

export default combineReducers({
	settings,
	login,
	meteor,
	server,
	selectedUsers,
	createChannel,
	app,
	room,
	rooms,
	sortPreferences,
	share,
	customEmojis,
	activeUsers,
	usersTyping,
	inviteLinks,
	createDiscussion,
	inquiry,
	enterpriseModules,
	encryption,
	permissions,
	roles,
	videoConf,
	usersRoles,
	troubleshootingNotification,
	supportedVersions,
	inAppFeedback
});

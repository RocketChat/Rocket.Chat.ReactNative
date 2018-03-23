import { all } from 'redux-saga/effects';
import hello from './hello';
import login from './login';
import connect from './connect';
import rooms from './rooms';
import messages from './messages';
import selectServer from './selectServer';
import createChannel from './createChannel';
import init from './init';
import state from './state';
import activeUsers from './activeUsers';
import starredMessages from './starredMessages';
import pinnedMessages from './pinnedMessages';
import mentionedMessages from './mentionedMessages';
import snippetedMessages from './snippetedMessages';
import roomFiles from './roomFiles';

const root = function* root() {
	yield all([
		init(),
		createChannel(),
		hello(),
		rooms(),
		login(),
		connect(),
		messages(),
		selectServer(),
		state(),
		activeUsers(),
		starredMessages(),
		pinnedMessages(),
		mentionedMessages(),
		snippetedMessages(),
		roomFiles()
	]);
};

export default root;

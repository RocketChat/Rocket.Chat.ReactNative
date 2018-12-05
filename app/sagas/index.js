import { all } from 'redux-saga/effects';
import login from './login';
import rooms from './rooms';
import messages from './messages';
import selectServer from './selectServer';
import createChannel from './createChannel';
import init from './init';
import state from './state';
import starredMessages from './starredMessages';
import pinnedMessages from './pinnedMessages';
import mentionedMessages from './mentionedMessages';
import snippetedMessages from './snippetedMessages';
import roomFiles from './roomFiles';
import deepLinking from './deepLinking';

const root = function* root() {
	yield all([
		init(),
		createChannel(),
		rooms(),
		login(),
		messages(),
		selectServer(),
		state(),
		starredMessages(),
		pinnedMessages(),
		mentionedMessages(),
		snippetedMessages(),
		roomFiles(),
		deepLinking()
	]);
};

export default root;

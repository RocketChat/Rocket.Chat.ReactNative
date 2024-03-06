import { all } from 'redux-saga/effects';

import inquiry from '../ee/omnichannel/sagas/inquiry';
import login from './login';
import rooms from './rooms';
import room from './room';
import messages from './messages';
import selectServer from './selectServer';
import createChannel from './createChannel';
import init from './init';
import state from './state';
import deepLinking from './deepLinking';
import inviteLinks from './inviteLinks';
import createDiscussion from './createDiscussion';
import encryption from './encryption';
import videoConf from './videoConf';
import troubleshootingNotification from './troubleshootingNotification';

const root = function* root() {
	yield all([
		init(),
		createChannel(),
		rooms(),
		room(),
		login(),
		messages(),
		selectServer(),
		state(),
		deepLinking(),
		inviteLinks(),
		createDiscussion(),
		inquiry(),
		encryption(),
		videoConf(),
		troubleshootingNotification()
	]);
};

export default root;

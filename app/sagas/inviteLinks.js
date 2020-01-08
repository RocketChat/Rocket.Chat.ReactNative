import {
	select, put, call, take, takeLatest
} from 'redux-saga/effects';

import { INVITE_LINKS } from '../actions/actionsTypes';
// import { createChannelSuccess, createChannelFailure } from '../actions/createChannel';
import RocketChat from '../lib/rocketchat';

const handleRequest = function* handleRequest({ token }) {
	try {
		const result = yield RocketChat.validateInviteToken(token);
    console.log('TCL: handleRequest -> result', result);
		// yield put(createChannelSuccess(result));
	} catch (err) {
		alert(err)
		// yield put(createChannelFailure(err));
	}
};

const root = function* root() {
	yield takeLatest(INVITE_LINKS.REQUEST, handleRequest);
};

export default root;

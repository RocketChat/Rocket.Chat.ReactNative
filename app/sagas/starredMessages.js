import { put, takeLatest } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readyStarredMessages } from '../actions/starredMessages';
import log from '../utils/log';

let sub;
let newSub;

const openStarredMessagesRoom = function* openStarredMessagesRoom({ rid, limit }) {
	try {
		newSub = yield RocketChat.subscribe('starredMessages', rid, limit);
		yield put(readyStarredMessages());
		if (sub) {
			sub.unsubscribe();
		}
		sub = newSub;
	} catch (e) {
		log('openStarredMessagesRoom', e);
	}
};

const closeStarredMessagesRoom = function* closeStarredMessagesRoom() {
	try {
		if (sub) {
			yield sub.unsubscribe();
		}
		if (newSub) {
			yield newSub.unsubscribe();
		}
	} catch (e) {
		log('closeStarredMessagesRoom', e);
	}
};

const root = function* root() {
	yield takeLatest(types.STARRED_MESSAGES.OPEN, openStarredMessagesRoom);
	yield takeLatest(types.STARRED_MESSAGES.CLOSE, closeStarredMessagesRoom);
};
export default root;

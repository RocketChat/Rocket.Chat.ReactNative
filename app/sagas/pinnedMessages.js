import { put, takeLatest } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readyPinnedMessages } from '../actions/pinnedMessages';
import log from '../utils/log';

let sub;
let newSub;

const openPinnedMessagesRoom = function* openPinnedMessagesRoom({ rid, limit }) {
	try {
		newSub = yield RocketChat.subscribe('pinnedMessages', rid, limit);
		yield put(readyPinnedMessages());
		if (sub) {
			sub.unsubscribe().catch(err => console.warn(err));
		}
		sub = newSub;
	} catch (e) {
		log('openPinnedMessagesRoom', e);
	}
};

const closePinnedMessagesRoom = function* closePinnedMessagesRoom() {
	try {
		if (sub) {
			yield sub.unsubscribe();
		}
		if (newSub) {
			yield newSub.unsubscribe();
		}
	} catch (e) {
		log('closePinnedMessagesRoom', e);
	}
};

const root = function* root() {
	yield takeLatest(types.PINNED_MESSAGES.OPEN, openPinnedMessagesRoom);
	yield takeLatest(types.PINNED_MESSAGES.CLOSE, closePinnedMessagesRoom);
};
export default root;

import { put, takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readyPinnedMessages } from '../actions/pinnedMessages';

let sub;
let newSub;

const openPinnedMessagesRoom = function* openPinnedMessagesRoom({ rid, limit }) {
	newSub = yield RocketChat.subscribe('pinnedMessages', rid, limit);
	yield put(readyPinnedMessages());
	if (sub) {
		sub.unsubscribe().catch(e => console.warn('openPinnedMessagesRoom', e));
	}
	sub = newSub;
};

const closePinnedMessagesRoom = function* closePinnedMessagesRoom() {
	if (sub) {
		yield sub.unsubscribe().catch(e => console.warn('closePinnedMessagesRoom sub', e));
	}
	if (newSub) {
		yield newSub.unsubscribe().catch(e => console.warn('closePinnedMessagesRoom newSub', e));
	}
};

const root = function* root() {
	yield takeLatest(types.PINNED_MESSAGES.OPEN, openPinnedMessagesRoom);
	yield takeLatest(types.PINNED_MESSAGES.CLOSE, closePinnedMessagesRoom);
};
export default root;

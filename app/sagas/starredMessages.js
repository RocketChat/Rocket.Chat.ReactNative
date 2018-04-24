import { put, takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readyStarredMessages } from '../actions/starredMessages';

let sub;
let newSub;

const openStarredMessagesRoom = function* openStarredMessagesRoom({ rid, limit }) {
	newSub = yield RocketChat.subscribe('starredMessages', rid, limit);
	yield put(readyStarredMessages());
	if (sub) {
		sub.unsubscribe().catch(e => console.warn('openStarredMessagesRoom', e));
	}
	sub = newSub;
};

const closeStarredMessagesRoom = function* closeStarredMessagesRoom() {
	if (sub) {
		yield sub.unsubscribe().catch(e => console.warn('closeStarredMessagesRoom sub', e));
	}
	if (newSub) {
		yield newSub.unsubscribe().catch(e => console.warn('closeStarredMessagesRoom newSub', e));
	}
};

const root = function* root() {
	yield takeLatest(types.STARRED_MESSAGES.OPEN, openStarredMessagesRoom);
	yield takeLatest(types.STARRED_MESSAGES.CLOSE, closeStarredMessagesRoom);
};
export default root;

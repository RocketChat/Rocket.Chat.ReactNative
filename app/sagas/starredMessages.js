import { takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

let sub;
let newSub;

const openStarredMessagesRoom = function* openStarredMessagesRoom({ rid, limit = 20 }) {
	newSub = yield RocketChat.subscribe('starredMessages', rid, limit);
	if (sub) {
		sub.unsubscribe();
	}
	sub = newSub;
};

const closeStarredMessagesRoom = function* closeStarredMessagesRoom() {
	if (sub) {
		yield sub.unsubscribe().catch(e => alert(e));
	}
	if (newSub) {
		yield newSub.unsubscribe().catch(e => alert(e));
	}
};

const root = function* root() {
	yield takeLatest(types.STARRED_MESSAGES.OPEN, openStarredMessagesRoom);
	yield takeLatest(types.STARRED_MESSAGES.CLOSE, closeStarredMessagesRoom);
};
export default root;

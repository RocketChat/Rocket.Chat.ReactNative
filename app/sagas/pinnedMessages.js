import { take, takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

const watchPinnedMessagesRoom = function* watchPinnedMessagesRoom({ rid }) {
	const sub = yield RocketChat.subscribe('pinnedMessages', rid, 50);
	yield take(types.PINNED_MESSAGES.CLOSE);
	sub.unsubscribe().catch(e => alert(e));
};

const root = function* root() {
	yield takeLatest(types.PINNED_MESSAGES.OPEN, watchPinnedMessagesRoom);
};
export default root;

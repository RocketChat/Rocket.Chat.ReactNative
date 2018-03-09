import { take, takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

const watchSnippetedMessagesRoom = function* watchSnippetedMessagesRoom({ rid }) {
	const sub = yield RocketChat.subscribe('snippetedMessages', rid, 50);
	yield take(types.SNIPPETED_MESSAGES.CLOSE);
	sub.unsubscribe().catch(e => alert(e));
};

const root = function* root() {
	yield takeLatest(types.SNIPPETED_MESSAGES.OPEN, watchSnippetedMessagesRoom);
};
export default root;

import { take, takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

const watchMentionedMessagesRoom = function* watchMentionedMessagesRoom({ rid }) {
	const sub = yield RocketChat.subscribe('mentionedMessages', rid, 50);
	yield take(types.MENTIONED_MESSAGES.CLOSE);
	sub.unsubscribe().catch(e => alert(e));
};

const root = function* root() {
	yield takeLatest(types.MENTIONED_MESSAGES.OPEN, watchMentionedMessagesRoom);
};
export default root;

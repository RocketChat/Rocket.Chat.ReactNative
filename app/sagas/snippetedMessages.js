import { put, takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readySnippetedMessages } from '../actions/snippetedMessages';

let sub;
let newSub;

const openSnippetedMessagesRoom = function* openSnippetedMessagesRoom({ rid, limit }) {
	newSub = yield RocketChat.subscribe('snippetedMessages', rid, limit);
	yield put(readySnippetedMessages());
	if (sub) {
		sub.unsubscribe().catch(e => console.warn('openSnippetedMessagesRoom', e));
	}
	sub = newSub;
};

const closeSnippetedMessagesRoom = function* closeSnippetedMessagesRoom() {
	if (sub) {
		yield sub.unsubscribe().catch(e => console.warn('closeSnippetedMessagesRoom sub', e));
	}
	if (newSub) {
		yield newSub.unsubscribe().catch(e => console.warn('closeSnippetedMessagesRoom newSub', e));
	}
};

const root = function* root() {
	yield takeLatest(types.SNIPPETED_MESSAGES.OPEN, openSnippetedMessagesRoom);
	yield takeLatest(types.SNIPPETED_MESSAGES.CLOSE, closeSnippetedMessagesRoom);
};
export default root;

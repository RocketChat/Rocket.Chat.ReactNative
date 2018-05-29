import { put, takeLatest } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readySnippetedMessages } from '../actions/snippetedMessages';
import log from '../utils/log';

let sub;
let newSub;

const openSnippetedMessagesRoom = function* openSnippetedMessagesRoom({ rid, limit }) {
	try {
		newSub = yield RocketChat.subscribe('snippetedMessages', rid, limit);
		yield put(readySnippetedMessages());
		if (sub) {
			sub.unsubscribe().catch(err => console.warn(err));
		}
		sub = newSub;
	} catch (e) {
		log('openSnippetedMessagesRoom', e);
	}
};

const closeSnippetedMessagesRoom = function* closeSnippetedMessagesRoom() {
	try {
		if (sub) {
			yield sub.unsubscribe();
		}
		if (newSub) {
			yield newSub.unsubscribe();
		}
	} catch (e) {
		log('closeSnippetedMessagesRoom', e);
	}
};

const root = function* root() {
	yield takeLatest(types.SNIPPETED_MESSAGES.OPEN, openSnippetedMessagesRoom);
	yield takeLatest(types.SNIPPETED_MESSAGES.CLOSE, closeSnippetedMessagesRoom);
};
export default root;

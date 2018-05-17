import { put, takeLatest } from 'redux-saga/effects';
import { Answers } from 'react-native-fabric';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readySnippetedMessages } from '../actions/snippetedMessages';

let sub;
let newSub;

const openSnippetedMessagesRoom = function* openSnippetedMessagesRoom({ rid, limit }) {
	try {
		newSub = yield RocketChat.subscribe('snippetedMessages', rid, limit);
		yield put(readySnippetedMessages());
		if (sub) {
			sub.unsubscribe();
		}
		sub = newSub;
	} catch (e) {
		Answers.logCustom('error', e);
		if (__DEV__) {
			console.warn('openSnippetedMessagesRoom', e);
		}
	}
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

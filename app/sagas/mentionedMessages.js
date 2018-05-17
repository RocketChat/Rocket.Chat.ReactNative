import { put, takeLatest } from 'redux-saga/effects';
import { Answers } from 'react-native-fabric';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readyMentionedMessages } from '../actions/mentionedMessages';

let sub;
let newSub;

const openMentionedMessagesRoom = function* openMentionedMessagesRoom({ rid, limit }) {
	try {
		newSub = yield RocketChat.subscribe('mentionedMessages', rid, limit);
		yield put(readyMentionedMessages());
		if (sub) {
			sub.unsubscribe();
		}
		sub = newSub;
	} catch (e) {
		Answers.logCustom('error', e);
		if (__DEV__) {
			console.warn('openMentionedMessagesRoom', e);
		}
	}
};

const closeMentionedMessagesRoom = function* closeMentionedMessagesRoom() {
	if (sub) {
		yield sub.unsubscribe().catch(e => console.warn('closeMentionedMessagesRoom sub', e));
	}
	if (newSub) {
		yield newSub.unsubscribe().catch(e => console.warn('closeMentionedMessagesRoom newSub', e));
	}
};

const root = function* root() {
	yield takeLatest(types.MENTIONED_MESSAGES.OPEN, openMentionedMessagesRoom);
	yield takeLatest(types.MENTIONED_MESSAGES.CLOSE, closeMentionedMessagesRoom);
};
export default root;

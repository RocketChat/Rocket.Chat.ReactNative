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
		Answers.logCustom('openMentionedMessagesRoom', e);
		if (__DEV__) {
			console.warn('openMentionedMessagesRoom', e);
		}
	}
};

const closeMentionedMessagesRoom = function* closeMentionedMessagesRoom() {
	try {
		if (sub) {
			yield sub.unsubscribe();
		}
		if (newSub) {
			yield newSub.unsubscribe();
		}
	} catch (e) {
		Answers.logCustom('closeMentionedMessagesRoom', e);
		if (__DEV__) {
			console.warn('closeMentionedMessagesRoom', e);
		}
	}
};

const root = function* root() {
	yield takeLatest(types.MENTIONED_MESSAGES.OPEN, openMentionedMessagesRoom);
	yield takeLatest(types.MENTIONED_MESSAGES.CLOSE, closeMentionedMessagesRoom);
};
export default root;

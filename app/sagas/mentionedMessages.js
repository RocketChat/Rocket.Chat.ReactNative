import { put, takeLatest } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readyMentionedMessages } from '../actions/mentionedMessages';
import log from '../utils/log';

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
		log('openMentionedMessagesRoom', e);
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
		log('closeMentionedMessagesRoom', e);
	}
};

const root = function* root() {
	yield takeLatest(types.MENTIONED_MESSAGES.OPEN, openMentionedMessagesRoom);
	yield takeLatest(types.MENTIONED_MESSAGES.CLOSE, closeMentionedMessagesRoom);
};
export default root;

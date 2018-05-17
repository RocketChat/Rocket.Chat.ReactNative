import { put, takeLatest } from 'redux-saga/effects';
import { Answers } from 'react-native-fabric';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readyPinnedMessages } from '../actions/pinnedMessages';

let sub;
let newSub;

const openPinnedMessagesRoom = function* openPinnedMessagesRoom({ rid, limit }) {
	try {
		newSub = yield RocketChat.subscribe('pinnedMessages', rid, limit);
		yield put(readyPinnedMessages());
		if (sub) {
			sub.unsubscribe();
		}
		sub = newSub;
	} catch (e) {
		Answers.logCustom('openPinnedMessagesRoom', e);
		if (__DEV__) {
			console.warn('openPinnedMessagesRoom', e);
		}
	}
};

const closePinnedMessagesRoom = function* closePinnedMessagesRoom() {
	try {
		if (sub) {
			yield sub.unsubscribe();
		}
		if (newSub) {
			yield newSub.unsubscribe();
		}
	} catch (e) {
		Answers.logCustom('closePinnedMessagesRoom', e);
		if (__DEV__) {
			console.warn('closePinnedMessagesRoom', e);
		}
	}
};

const root = function* root() {
	yield takeLatest(types.PINNED_MESSAGES.OPEN, openPinnedMessagesRoom);
	yield takeLatest(types.PINNED_MESSAGES.CLOSE, closePinnedMessagesRoom);
};
export default root;

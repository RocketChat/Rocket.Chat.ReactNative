import { take, takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

const watchStarredMessagesRoom = function* watchStarredMessagesRoom({ rid }) {
	try {
		const sub = yield RocketChat.subscribe('starredMessages', rid, 50);
		yield take(types.STARRED_MESSAGES.CLOSE);
		yield sub.unsubscribe();
	} catch (e) {
		console.log(e);
	}
};

const root = function* root() {
	yield takeLatest(types.STARRED_MESSAGES.OPEN, watchStarredMessagesRoom);
};
export default root;

import { put, takeLatest } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readyRoomFiles } from '../actions/roomFiles';
import log from '../utils/log';

let sub;
let newSub;

const openRoomFiles = function* openRoomFiles({ rid, limit }) {
	try {
		sub = yield RocketChat.subscribe('roomFiles', rid, limit);
		yield put(readyRoomFiles());
		if (sub) {
			sub.unsubscribe().catch(err => console.warn(err));
		}
		sub = newSub;
	} catch (e) {
		log('openRoomFiles', e);
	}
};

const closeRoomFiles = function* closeRoomFiles() {
	try {
		// yield sub.unsubscribe(sub);
		// sub = null;
		if (sub) {
			yield sub.unsubscribe();
		}
		if (newSub) {
			yield newSub.unsubscribe();
		}
	} catch (e) {
		log('closeRoomFiles', e);
	}
};

const root = function* root() {
	yield takeLatest(types.ROOM_FILES.OPEN, openRoomFiles);
	yield takeLatest(types.ROOM_FILES.CLOSE, closeRoomFiles);
};
export default root;

import { put, takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readyRoomFiles } from '../actions/roomFiles';

let sub;
let newSub;

const openRoomFiles = function* openRoomFiles({ rid, limit }) {
	newSub = yield RocketChat.subscribe('roomFiles', rid, limit);
	yield put(readyRoomFiles());
	if (sub) {
		sub.unsubscribe().catch(e => console.warn('openRoomFiles', e));
	}
	sub = newSub;
};

const closeRoomFiles = function* closeRoomFiles() {
	if (sub) {
		yield sub.unsubscribe().catch(e => console.warn('closeRoomFiles sub', e));
	}
	if (newSub) {
		yield newSub.unsubscribe().catch(e => console.warn('closeRoomFiles newSub', e));
	}
};

const root = function* root() {
	yield takeLatest(types.ROOM_FILES.OPEN, openRoomFiles);
	yield takeLatest(types.ROOM_FILES.CLOSE, closeRoomFiles);
};
export default root;

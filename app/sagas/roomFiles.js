import { put, takeLatest } from 'redux-saga/effects';
import { Answers } from 'react-native-fabric';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { readyRoomFiles } from '../actions/roomFiles';

let sub;
let newSub;

const openRoomFiles = function* openRoomFiles({ rid, limit }) {
	try {
		newSub = yield RocketChat.subscribe('roomFiles', rid, limit);
		yield put(readyRoomFiles());
		if (sub) {
			sub.unsubscribe();
		}
		sub = newSub;
	} catch (e) {
		Answers.logCustom('openRoomFiles', e);
		if (__DEV__) {
			console.warn('openRoomFiles', e);
		}
	}
};

const closeRoomFiles = function* closeRoomFiles() {
	try {
		if (sub) {
			yield sub.unsubscribe();
		}
		if (newSub) {
			yield newSub.unsubscribe();
		}
	} catch (e) {
		Answers.logCustom('closeRoomFiles', e);
		if (__DEV__) {
			console.warn('closeRoomFiles', e);
		}
	}
};

const root = function* root() {
	yield takeLatest(types.ROOM_FILES.OPEN, openRoomFiles);
	yield takeLatest(types.ROOM_FILES.CLOSE, closeRoomFiles);
};
export default root;

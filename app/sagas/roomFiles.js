import { take, takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

const watchRoomFiles = function* watchRoomFiles({ rid }) {
	try {
		const sub = yield RocketChat.subscribe('roomFiles', rid, 50);
		yield take(types.ROOM_FILES.CLOSE);
		yield sub.unsubscribe();
	} catch (e) {
		console.log(e);
	}
};

const root = function* root() {
	yield takeLatest(types.ROOM_FILES.OPEN, watchRoomFiles);
};
export default root;

import { put, call, takeEvery } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure } from '../actions/rooms';
import RocketChat from '../lib/rocketchat';

const getRooms = function* getRooms() {
	return yield RocketChat.getRooms();
};

const watchRoomsRequest = function* watchRoomsRequest() {
	try {
		console.log('getRooms');
		yield call(getRooms);
		yield put(roomsSuccess());
	} catch (err) {
		console.log(err);
		yield put(roomsFailure(err.status));
	}
};
const root = function* root() {
	yield takeEvery(types.LOGIN.SUCCESS, watchRoomsRequest);
};
export default root;

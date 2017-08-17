import { take, put, call, fork } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure } from '../actions/rooms';
import RocketChat from '../lib/rocketchat';

function getRooms(...args) {
	// console.log('\n\n\n\n\n\naqui\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n');
	return RocketChat.getRooms(...args);
}

const watchRoomsRequest = function* watchRoomsRequest() {
	// console.log('\n\n\n\n\n\n\n\nWAINTING FOR LOGINsss\n\n\n\n\n\n\n\n');
	while (true) {
		// console.log('\n\n\n\n\n\n\n\nWAINTING FOR LOGIN\n\n\n\n\n\n\n\n');
		yield take(types.LOGIN.SUCCESS);
		// console.log('\n\n\n\n\n\n\n\nWAINTING FOR LOGIN NO MORE\n\n\n\n\n\n\n\n');
		// const payload = yield take(types.ROOMS.REQUEST);
		try {
			yield call(getRooms);
			yield put(roomsSuccess());
		} catch (err) {
			console.log(err);
			yield put(roomsFailure(err.status));
		}
	}
};

export default watchRoomsRequest;

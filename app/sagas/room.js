import { put, call, takeEvery } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { roomRolesSuccess, roomRolesFailure } from '../actions/room';
import RocketChat from '../lib/rocketchat';

const getRoomRoles = rid => RocketChat.getRoomRoles(rid);

const handleRoomRolesRequest = function* handleRoomRolesRequest({ rid }) {
	try {
		yield call(getRoomRoles, rid);
		yield put(roomRolesSuccess());
	} catch (err) {
		yield put(roomRolesFailure(err));
	}
};
const root = function* root() {
	yield takeEvery(types.ROOM_ROLES.REQUEST, handleRoomRolesRequest);
};
export default root;

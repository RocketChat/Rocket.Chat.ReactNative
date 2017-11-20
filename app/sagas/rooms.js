import { put, call, takeLatest, takeEvery, take, select, race, fork, cancel } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure } from '../actions/rooms';
import { addUserTyping, removeUserTyping } from '../actions/room';
import { messagesRequest } from '../actions/messages';
import RocketChat from '../lib/rocketchat';

const getRooms = function* getRooms() {
	return yield RocketChat.getRooms();
};

const watchRoomsRequest = function* watchRoomsRequest() {
	try {
		yield call(getRooms);
		yield put(roomsSuccess());
	} catch (err) {
		yield put(roomsFailure(err.status));
	}
};
const userTyping = function* userTyping({ rid }) {
	while (true) {
		const { _rid, username, typing } = yield take(types.ROOM.USER_TYPING);
		if (_rid === rid) {
			const tmp = yield (typing ? put(addUserTyping(username)) : put(removeUserTyping(username)));
		}
	}
};

const watchRoomOpen = function* watchRoomOpen({ rid }) {
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		yield take(types.LOGIN.SUCCESS);
	}
	const subscriptions = [];
	yield put(messagesRequest({ rid }));

	const { open } = yield race({
		messages: take(types.MESSAGES.SUCCESS),
		open: take(types.ROOMS.OPEN)
	});

	if (open) {
		return;
	}
	RocketChat.readMessages(rid);
	subscriptions.push(RocketChat.subscribe('stream-room-messages', rid, false));
	subscriptions.push(RocketChat.subscribe('stream-notify-room', `${ rid }/typing`, false));
	const thread = yield fork(userTyping, { rid });
	yield take(types.ROOMS.OPEN);
	cancel(thread);
	subscriptions.forEach(sub => sub.stop());
};


const root = function* root() {
	yield takeLatest(types.LOGIN.SUCCESS, watchRoomsRequest);
	yield takeEvery(types.ROOMS.OPEN, watchRoomOpen);
};
export default root;

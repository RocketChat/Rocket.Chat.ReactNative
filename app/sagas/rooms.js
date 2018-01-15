import { put, call, takeLatest, take, select, race, fork, cancel, takeEvery } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { FOREGROUND, BACKGROUND } from 'redux-enhancer-react-native-appstate';
import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure } from '../actions/rooms';
import { addUserTyping, removeUserTyping, setLastOpen } from '../actions/room';
import { messagesRequest } from '../actions/messages';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';

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

const cancelTyping = function* cancelTyping(username) {
	while (true) {
		const { typing, timeout } = yield race({
			typing: take(types.ROOM.SOMEONE_TYPING),
			timeout: call(delay, 5000)
		});
		if (timeout || (typing.username === username && !typing.typing)) {
			return yield put(removeUserTyping(username));
		}
	}
};

const usersTyping = function* usersTyping({ rid }) {
	while (true) {
		const { _rid, username, typing } = yield take(types.ROOM.SOMEONE_TYPING);
		if (_rid === rid) {
			yield (typing ? put(addUserTyping(username)) : put(removeUserTyping(username)));
			if (typing) {
				yield fork(cancelTyping, username);
			}
		}
	}
};
const handleMessageReceived = function* handleMessageReceived({ message }) {
	const room = yield select(state => state.room);

	if (message.rid === room.rid) {
		database.write(() => {
			database.create('messages', message, true);
		});

		RocketChat.readMessages(room.rid);
	}
};

const watchRoomOpen = function* watchRoomOpen({ room }) {
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		yield take(types.LOGIN.SUCCESS);
	}


	yield put(messagesRequest({ rid: room.rid }));

	const { open } = yield race({
		messages: take(types.MESSAGES.SUCCESS),
		open: take(types.ROOM.OPEN)
	});

	if (open) {
		return;
	}
	RocketChat.readMessages(room.rid);
	const subscriptions = yield Promise.all([RocketChat.subscribe('stream-room-messages', room.rid, false), RocketChat.subscribe('stream-notify-room', `${ room.rid }/typing`, false)]);
	const thread = yield fork(usersTyping, { rid: room.rid });
	yield race({
		open: take(types.ROOM.OPEN),
		close: take(types.ROOM.CLOSE)
	});
	cancel(thread);
	subscriptions.forEach((sub) => {
		sub.unsubscribe().catch(e => alert(e));
	});
};

const watchuserTyping = function* watchuserTyping({ status }) {
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		yield take(types.LOGIN.SUCCESS);
	}

	const room = yield select(state => state.room);

	if (!room) {
		return;
	}
	yield RocketChat.emitTyping(room.rid, status);

	if (status) {
		yield call(delay, 5000);
		yield RocketChat.emitTyping(room.rid, false);
	}
};

const updateRoom = function* updateRoom() {
	const room = yield select(state => state.room);
	if (!room || !room.rid) {
		return;
	}
	yield put(messagesRequest({ rid: room.rid }));
};

const updateLastOpen = function* updateLastOpen() {
	yield put(setLastOpen());
};

const root = function* root() {
	yield takeLatest(types.ROOM.USER_TYPING, watchuserTyping);
	yield takeLatest(types.LOGIN.SUCCESS, watchRoomsRequest);
	yield takeLatest(types.ROOM.OPEN, watchRoomOpen);
	yield takeEvery(types.ROOM.MESSAGE_RECEIVED, handleMessageReceived);
	yield takeLatest(FOREGROUND, updateRoom);
	yield takeLatest(FOREGROUND, watchRoomsRequest);
	yield takeLatest(BACKGROUND, updateLastOpen);
};
export default root;

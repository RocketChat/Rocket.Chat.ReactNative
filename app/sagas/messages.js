import { takeLatest, select, take, put, call } from 'redux-saga/effects';
import { MESSAGES, LOGIN } from '../actions/actionsTypes';
import { messagesSuccess, messagesFailure, editSuccess, editFailure } from '../actions/messages';
import RocketChat from '../lib/rocketchat';

const editMessage = message => RocketChat.editMessage(message);

const get = function* get({ rid }) {
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		yield take(LOGIN.SUCCESS);
	}
	try {
		yield RocketChat.loadMessagesForRoom(rid, null);
		yield RocketChat.readMessages(rid);
		yield put(messagesSuccess());
	} catch (err) {
		console.log(err);
		yield put(messagesFailure(err.status));
	}
};

const handleEditRequest = function* handleEditRequest({ message }) {
	try {
		yield call(editMessage, message);
		yield put(editSuccess());
	} catch (error) {
		yield put(editFailure());
	}
};

const root = function* root() {
	yield takeLatest(MESSAGES.REQUEST, get);
	yield takeLatest(MESSAGES.EDIT_REQUEST, handleEditRequest);
};
export default root;

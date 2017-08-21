import { takeEvery, takeLatest, select, take, put } from 'redux-saga/effects';
import { MESSAGES, LOGIN } from '../actions/actionsTypes';
import { messagesSuccess, messagesFailure } from '../actions/messages';
import RocketChat from '../lib/rocketchat';

const get = function* get({ rid }) {
	const auth = yield select(state => state.login.isAuthenticated);
	console.log('hey now', yield select(state => state.login));
	if (!auth) {
		yield take(LOGIN.SUCCESS);
	}
	try {
		yield RocketChat.loadMessagesForRoom(rid, null);
		yield put(messagesSuccess());
	} catch (err) {
		console.log(err);
		yield put(messagesFailure(err.status));
	}
};
const getData = function* getData() {
	yield takeLatest(MESSAGES.REQUEST, get);
};
export default getData;

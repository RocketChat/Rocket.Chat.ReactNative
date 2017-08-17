import { take, put, call, fork, takeLatest } from 'redux-saga/effects';
import { METEOR } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

import { connectSuccess, connectRequest, connectFailure } from '../actions/connect';

function connect(...args) {
	return RocketChat.connect(...args);
}
const auto = function* auto() {
	while (true) {
		yield take(METEOR.DISCONNECT);
		console.log('\n\n[METEOR DISCONNECT]\n\n');
		yield put(connectRequest());
	}
};
const test = function* test() {
	const response = yield call(connect);
	yield put(connectSuccess(response));
	console.log('\n\n[METEOR CONNECTED]\n\n');
};
const watchConnect = function* watchConnect() {
	while (true) {
		try {
			yield takeLatest(METEOR.REQUEST, test);
		} catch (err) {
			yield put(connectFailure(err.status));
		}
		yield take(METEOR.DISCONNECT);
		console.log('\n\n[METEOR DISCONNECT]\n\n');
	}
};
const root = function* root() {
	yield fork(watchConnect);
	// yield fork(auto);
};
export default root;

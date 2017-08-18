import { take, put, call, fork, takeLatest, select } from 'redux-saga/effects';
import { METEOR } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

import { connectSuccess, connectFailure } from '../actions/connect';

const getServer = ({ server }) => server;


const connect = url => RocketChat.connect(url);
const test = function* test() {
	try {
		const server = yield select(getServer);
		const response = yield call(connect, server);
		yield put(connectSuccess(response));
	} catch (err) {
		yield put(connectFailure(err.status));
	}
};
const watchConnect = function* watchConnect() {
	yield takeLatest(METEOR.REQUEST, test);
	while (true) {
		yield take(METEOR.DISCONNECT);
	}
};
const root = function* root() {
	yield fork(watchConnect);
	// yield fork(auto);
};
export default root;

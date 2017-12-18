import { put, call, takeLatest, select } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { METEOR } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

import { connectSuccess, connectFailure } from '../actions/connect';

const getServer = ({ server }) => server.server;


const connect = url => RocketChat.connect(url);


const watchConnect = function* watchConnect() {
	const { meteor } = yield select(state => state);
	if (meteor.disconnected_by_user) {
		return;
	}
	yield call(delay, 1000);
	yield RocketChat.reconnect();
};
const test = function* test() {
	try {
		const server = yield select(getServer);
		const response = yield call(connect, server);
		yield put(connectSuccess(response));
	} catch (err) {
		yield put(connectFailure(err.status));
	}
};

const root = function* root() {
	yield takeLatest(METEOR.REQUEST, test);
	// yield take(METEOR.SUCCESS, watchConnect);
	// yield takeLatest(METEOR.DISCONNECT, watchConnect);
};
export default root;

import { take, put, call, fork } from 'redux-saga/effects';
import { METEOR } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

import { connectSuccess, connectFailure } from '../actions/connect';

function connect(...args) {
	return RocketChat.connect(...args);
}

const watchConnect = function* watchConnect() {
	while (true) {
		yield take(METEOR.REQUEST);
		try {
			const response = yield call(connect);
			yield put(connectSuccess(response));
		} catch (err) {
			yield put(connectFailure(err.status));
		}
	}
};

const root = function* root() {
	yield fork(watchConnect);
};
export default root;

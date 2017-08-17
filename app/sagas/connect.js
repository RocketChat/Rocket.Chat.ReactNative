import { take, put, call } from 'redux-saga/effects';
import { METEOR } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

import { connectSuccess, connectFailure } from '../actions/connect';

function connect(...args) {
	return RocketChat.connect(...args);
}

const watchConnect = function* watchConnect() {
	while (true) {
		yield take(METEOR.REQUEST);
		console.log('\n\n[METEOR CONNECTED]\n\n');
		try {
			const response = yield call(connect);
			yield put(connectSuccess(response));
		} catch (err) {
			yield put(connectFailure(err.status));
		}
	}
};
export default watchConnect;

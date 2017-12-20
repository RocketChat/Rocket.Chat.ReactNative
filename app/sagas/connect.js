import { call, takeLatest, select, take, race } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { METEOR } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';

const getServer = ({ server }) => server.server;


const connect = url => RocketChat.connect(url);
const watchConnect = function* watchConnect() {
	const { disconnect } = yield race({
		disconnect: take(METEOR.DISCONNECT),
		disconnected_by_user: take(METEOR.DISCONNECT_BY_USER)
	});
	if (disconnect) {
		while (true) {
			const { connected } = yield race({
				connected: take(METEOR.SUCCESS),
				timeout: call(delay, 1000)
			});
			if (connected) {
				return;
			}
			yield RocketChat.reconnect();
		}
	}
};
const test = function* test() {
	// try {
	const server = yield select(getServer);
	// const response =
	yield call(connect, server);
	// yield put(connectSuccess(response));
	// } catch (err) {
	// yield put(connectFailure(err.status));
	// }
};

const root = function* root() {
	yield takeLatest(METEOR.REQUEST, test);
	// yield take(METEOR.SUCCESS, watchConnect);
	yield takeLatest(METEOR.SUCCESS, watchConnect);
};
export default root;

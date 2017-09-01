import { delay } from 'redux-saga';
import { select, put, call, fork, take } from 'redux-saga/effects';
import { CREATE_CHANNEL, LOGIN } from '../actions/actionsTypes';
import { createChannelSuccess, createChannelFailure } from '../actions/createChannel';
import RocketChat from '../lib/rocketchat';


const create = function* create(data) {
	return yield RocketChat.createChannel(data);
};

const get = function* get() {
	while (true) {
		try {
			const { data } = yield take(CREATE_CHANNEL.REQUEST);
			const auth = yield select(state => state.login.isAuthenticated);
			if (!auth) {
				yield take(LOGIN.SUCCESS);
			}
			const result = yield call(create, data);
			yield put(createChannelSuccess(result));
			select(({ navigator }) => navigator).dismissModal({
				animationType: 'slide-down'
			});
		} catch (err) {
			yield delay(2000);
			yield put(createChannelFailure(err));
		}
	}
};
const getData = function* getData() {
	yield fork(get);
};
export default getData;

import { delay } from 'redux-saga';
import { select, put, call, take, takeLatest } from 'redux-saga/effects';
import { CREATE_CHANNEL, LOGIN } from '../actions/actionsTypes';
import { createChannelSuccess, createChannelFailure } from '../actions/createChannel';
import RocketChat from '../lib/rocketchat';

const create = function* create(data) {
	return yield RocketChat.createChannel(data);
};

const get = function* get({ data }) {
	try {
		yield delay(1000);
		const auth = yield select(state => state.login.isAuthenticated);
		if (!auth) {
			yield take(LOGIN.SUCCESS);
		}
		const result = yield call(create, data);
		yield put(createChannelSuccess(result));
	} catch (err) {
		yield put(createChannelFailure(err));
	}
};

const getData = function* getData() {
	yield takeLatest(CREATE_CHANNEL.REQUEST, get);
};

export default getData;

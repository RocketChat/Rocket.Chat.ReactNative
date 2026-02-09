import { call, select, takeEvery } from 'redux-saga/effects';

import { METEOR } from '../actions/actionsTypes';
import log from '../lib/methods/helpers/log';
import { retryErrorMessages } from '../lib/methods/messageSync';

const getUser = state => state.login.user;

const retryErrorMessagesSaga = function* retryErrorMessagesSaga() {
	const user = yield select(getUser);
	if (!user?.id) {
		return;
	}
	try {
		yield call(retryErrorMessages);
	} catch (e) {
		log(e);
	}
};

const root = function* root() {
	yield takeEvery(METEOR.SUCCESS, retryErrorMessagesSaga);
};

export default root;

import React from 'react';
import { take, put, call, fork } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { loginSuccess, loginFailure } from '../actions/login';
import RocketChat from '../lib/rocketchat';

function loginCall(...args) {
	return RocketChat.loginWithPassword(...args);
}

const watchLoginRequest = function* watchLoginRequest() {
	while (true) {
		yield take(types.METEOR.SUCCESS);
		const payload = yield take(types.LOGIN.REQUEST);
		try {
			const response = yield call(loginCall, payload);
			yield put(loginSuccess(response));
		} catch (err) {
			yield put(loginFailure(err.status));
		}
	}
};

const root = function* root() {
	yield fork(watchLoginRequest);
};
export default root;

import React from 'react';
import { take, put, call, takeLast, fork, select } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { loginSuccess, loginFailure, logout } from '../actions/login';
import RocketChat from '../lib/rocketchat';

const getUser = state => state.login;
function loginCall(args) {
	return RocketChat.loginWithPassword(args);
}
const auto = function* auto() {
	while (true) {
		yield take(types.METEOR.SUCCESS);
		const user = yield select(getUser);
		if (user.token) {
			RocketChat.login({ resume: user.token });
		}
	}
};
const watchLoginRequest = function* watchLoginRequest() {
	while (true) {
		try {
			yield take(types.METEOR.SUCCESS);
			console.log('\n\n[LOGIN METEOR CONNECTED]\n\n');
			const payload = yield take(types.LOGIN.REQUEST);
			try {
				const response = yield call(loginCall, payload);
				console.log(response);
				yield put(loginSuccess(response));
				console.log('\n\n[LOGIN SUCCESS]\n\n');
			} catch (err) {
				console.log('\n\n[LOGIN FAILURE]\n\n', err);
				yield put(loginFailure(err.status));
			}
			yield take(types.METEOR.DISCONNECT);
			console.log('\n\n[METEOR DISCONNECT LOGOUT]\n\n');
			yield put(logout());
		} catch (e) {
			console.log(e);
		}
	}
};

const root = function* root() {
	yield fork(watchLoginRequest);
	yield fork(auto);
};
export default watchLoginRequest;

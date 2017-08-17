import React from 'react';
import { take, put, call, takeLast, fork, select } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { loginRequest, loginSuccess, loginFailure, logout } from '../actions/login';
import RocketChat from '../lib/rocketchat';

const getUser = state => state.login.user;
function loginCall(args) {
	return args.resume ? RocketChat.login(args) : RocketChat.loginWithPassword(args);
}
const auto = function* auto() {
	while (true) {
		yield take(types.LOGOUT);
		yield take(types.METEOR.SUCCESS);
		const user = yield select(getUser);
		if (user.token) {
			yield put(loginRequest({ resume: user.token }));
		}
	}
};
const watchLoginRequest = function* watchLoginRequest() {
	while (true) {
		try {
			yield take(types.METEOR.SUCCESS);
			// console.log('\n\n[LOGIN METEOR CONNECTED]\n\n');
			const payload = yield take(types.LOGIN.REQUEST);
			try {
				const response = yield call(loginCall, payload);
				yield put(loginSuccess(response));
				console.log('\n\n[LOGIN SUCCESS]\n\n');
			} catch (err) {
				// console.log('\n\n[LOGIN FAILURE]\n\n', err);
				yield put(loginFailure(err.status));
			}
			yield take(types.METEOR.DISCONNECT);
			console.log('\n\n[METEOR DISCONNECT LOGOUT]\n\n');
			yield put(logout());
		} catch (e) {
			console.error(e);
		}
	}
};

const root = function* root() {
	yield fork(watchLoginRequest);
	yield fork(auto);
};
export default root;

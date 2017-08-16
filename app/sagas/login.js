import React from 'react';
import { take, put, call, fork, select } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { loginSuccess, loginFailure } from '../actions/login';
import RocketChat from '../lib/rocketchat';

function loginCall(...args) {
	return RocketChat.loginWithPassword(...args);
}

function* watchLoginRequest() {
	while (true) {
		const payload = yield take(types.LOGIN.REQUEST);
		try {
			const response = yield call(loginCall, payload);
			yield put(loginSuccess(response));
			console.log('SAGA LOGIN SUCCESS: ', response);
		} catch (err) {
			console.log('SAGA LOGIN ERR: ', err);
			yield put(loginFailure(err.status));
		}
	}
}

export default function* root() {
	yield fork(watchLoginRequest);
}

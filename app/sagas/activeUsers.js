import { put, take, race, fork } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import * as types from '../actions/actionsTypes';

import { setActiveUser } from '../actions/activeUsers';

const watchActiveUsers = function* handleInput() {
	let obj = {};
	while (true) {
		const { status, timeout } = yield race({
			status: take(types.ACTIVE_USERS.REQUEST),
			timeout: delay(3000)
		});
		if (timeout && Object.keys(obj).length > 0) {
			yield put(setActiveUser(obj));
			obj = {};
		}
		if (status) {
			obj = {
				...obj,
				...status.user
			};
		}
	}
};

const root = function* root() {
	yield fork(watchActiveUsers);
};
export default root;

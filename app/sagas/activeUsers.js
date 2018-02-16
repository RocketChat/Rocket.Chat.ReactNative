import { put, takeLatest } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';

import { setActiveUser } from '../actions/activeUsers';

const watchActiveUsers = function* handleInput({ users }) {
	yield put(setActiveUser(users));
};

const root = function* root() {
	yield takeLatest(types.ACTIVE_USERS.REQUEST, watchActiveUsers);
};
export default root;

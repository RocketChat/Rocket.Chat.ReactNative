import { put, takeEvery } from 'redux-saga/effects';

import { SERVER } from '../actions/actionsTypes';
import { connectRequest, disconnect } from '../actions/connect';
import { changedServer } from '../actions/server';

const selectServer = function* selectServer(server) {
	yield put(disconnect());
	yield put(changedServer(server));
	yield put(connectRequest(server));
};
const root = function* root() {
	yield takeEvery(SERVER.SELECT, selectServer);
};
export default root;

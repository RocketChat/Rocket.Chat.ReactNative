import { put, takeEvery } from 'redux-saga/effects';

import { SERVER } from '../actions/actionsTypes';
import { connectRequest, disconnect } from '../actions/connect';
import { changedServer } from '../actions/server';

const selectServer = function* selectServer(server) {
	try {
		yield put(disconnect());
		yield put(changedServer(server));
		yield (server && put(connectRequest(server)));
		// console.log(Actions.login());
		// Actions.replace('login', {});
	} catch (e) {
		console.log(e);
	}
};
const root = function* root() {
	yield takeEvery(SERVER.SELECT, selectServer);
};
export default root;

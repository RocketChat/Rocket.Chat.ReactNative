import { put, takeEvery, call } from 'redux-saga/effects';
import { AsyncStorage } from 'react-native';
import { SERVER } from '../actions/actionsTypes';
import { connectRequest, disconnect } from '../actions/connect';
import { changedServer } from '../actions/server';

const selectServer = function* selectServer({ server }) {
	yield put(disconnect());
	yield put(changedServer(server));
	yield console.log('SERVER->', server);
	yield call([AsyncStorage, 'setItem'], 'currentServer', server);
	yield put(connectRequest(server));
};
const root = function* root() {
	yield takeEvery(SERVER.SELECT, selectServer);
};
export default root;

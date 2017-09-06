import { AsyncStorage } from 'react-native';
import { call, put, take } from 'redux-saga/effects';
import * as actions from '../actions';
import { setServer } from '../actions/server';
import { APP } from '../actions/actionsTypes';

const restore = function* restore() {
	try {
		yield take(APP.INIT);
		const currentServer = yield call([AsyncStorage, 'getItem'], 'currentServer');
		yield put(actions.appReady({}));
		if (currentServer) {
			yield put(setServer(currentServer));
		}
	} catch (e) {
		console.log(e);
	}
};
export default restore;

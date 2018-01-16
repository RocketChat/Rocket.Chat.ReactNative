import { AsyncStorage } from 'react-native';
import { call, put, takeLatest } from 'redux-saga/effects';
import * as actions from '../actions';
import { setServer } from '../actions/server';
import { restoreToken } from '../actions/login';
import { APP } from '../actions/actionsTypes';
import database from '../lib/realm';
import RocketChat from '../lib/rocketchat';

const restore = function* restore() {
	try {
		const token = yield call([AsyncStorage, 'getItem'], 'reactnativemeteor_usertoken');
		if (token) {
			yield put(restoreToken(token));
		}

		const currentServer = yield call([AsyncStorage, 'getItem'], 'currentServer');
		if (currentServer) {
			yield put(setServer(currentServer));
			const settings = database.objects('settings');
			yield put(actions.setAllSettings(RocketChat.parseSettings(settings.slice(0, settings.length))));
			const permissions = database.objects('permissions');
			yield put(actions.setAllPermissions(RocketChat.parsePermissions(permissions.slice(0, permissions.length))));
			const emojis = database.objects('customEmojis');
			yield put(actions.setCustomEmojis(RocketChat.parseEmojis(emojis.slice(0, emojis.length))));
		}
		yield put(actions.appReady({}));
	} catch (e) {
		console.log(e);
	}
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
};
export default root;

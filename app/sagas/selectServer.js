import { put, takeLatest } from 'redux-saga/effects';
import { AsyncStorage, Alert } from 'react-native';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';


import Navigation from '../lib/Navigation';
import { SERVER } from '../actions/actionsTypes';
import * as actions from '../actions';
import { serverFailure, selectServerRequest, selectServerSuccess } from '../actions/server';
import { setRoles } from '../actions/roles';
import { setUser } from '../actions/login';
import RocketChat from '../lib/rocketchat';
import realm from '../lib/realm';
import log from '../utils/log';
import I18n from '../i18n';
import { serverDatabase } from '../lib/database';

const handleSelectServer = function* handleSelectServer({ server }) {
	try {
		yield AsyncStorage.setItem('currentServer', server);
		const userStringified = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`);

		if (userStringified) {
			const user = JSON.parse(userStringified);
			RocketChat.connect({ server, user });
			yield put(setUser(user));
			yield put(actions.appStart('inside'));
		} else {
			RocketChat.connect({ server });
		}

		const settings = realm.objects('settings');
		yield put(actions.setAllSettings(RocketChat.parseSettings(settings.slice(0, settings.length))));
		const emojis = realm.objects('customEmojis');
		yield put(actions.setCustomEmojis(RocketChat.parseEmojis(emojis.slice(0, emojis.length))));
		const roles = realm.objects('roles');
		yield put(setRoles(roles.reduce((result, role) => {
			result[role._id] = role.description;
			return result;
		}, {})));

		yield put(selectServerSuccess(server));
	} catch (e) {
		log('handleSelectServer', e);
	}
};

const handleServerRequest = function* handleServerRequest({ server }) {
	try {
		const result = yield RocketChat.testServer(server);
		if (!result.success) {
			Alert.alert(I18n.t('Oops'), I18n.t(result.message, result.messageOptions));
			yield put(serverFailure());
			return;
		}

		yield serverDatabase.action(async() => {
			const serversCollection = serverDatabase.collections.get('servers');
			try {
				await serversCollection.find(server);
			} catch (error) {
				await serversCollection.create((newServer) => {
					newServer._raw = sanitizedRaw({ id: server }, serversCollection.schema);
				});
			}
		});

		const loginServicesLength = yield RocketChat.getLoginServices(server);
		if (loginServicesLength === 0) {
			yield Navigation.push('NewServerView', {
				component: {
					name: 'LoginView'
				}
			});
		} else {
			yield Navigation.push('NewServerView', {
				component: {
					name: 'LoginSignupView'
				}
			});
		}

		yield put(selectServerRequest(server));
	} catch (e) {
		yield put(serverFailure());
		log('handleServerRequest', e);
	}
};

const root = function* root() {
	yield takeLatest(SERVER.SELECT_REQUEST, handleSelectServer);
	yield takeLatest(SERVER.REQUEST, handleServerRequest);
};
export default root;

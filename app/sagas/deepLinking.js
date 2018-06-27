import { AsyncStorage, Platform } from 'react-native';
import { takeLatest, take, select, put } from 'redux-saga/effects';
import { Navigation } from 'react-native-navigation';

import * as types from '../actions/actionsTypes';
import { selectServer, addServer } from '../actions/server';
import database from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import { NavigationActions } from '../Navigation';
import I18n from '../i18n';

const navigate = function* go({ params, sameServer = true }) {
	if (!sameServer) {
		yield Navigation.startSingleScreenApp({
			screen: {
				screen: 'RoomsListView',
				title: I18n.t('Messages')
			},
			drawer: {
				left: {
					screen: 'Sidebar'
				}
			},
			animationType: Platform.OS === 'ios' ? 'none' : 'slide-down'
		});
	}
	if (params.rid) {
		const canOpenRoom = yield RocketChat.canOpenRoom(params);
		if (canOpenRoom) {
			return NavigationActions.push({
				screen: 'RoomView',
				passProps: {
					rid: params.rid
				}
			});
		}
	}
};

const handleOpen = function* handleOpen({ params }) {
	const isReady = yield select(state => state.app.ready);
	const server = yield select(state => state.server.server);

	if (!isReady) {
		yield take(types.APP.READY);
	}

	if (!params.host) {
		return;
	}

	const host = `https://${ params.host }`;

	try {
		yield RocketChat.testServer(host);
	} catch (error) {
		return;
	}

	const token = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ host }`);


	// TODO: needs better test
	// if deep link is from same server
	if (server === host) {
		if (token) {
			yield navigate({ params });
		}
	} else { // if deep link is from a different server
		// search if deep link's server already exists
		const servers = yield database.databases.serversDB.objects('servers').filtered('id = $0', host); // TODO: need better test
		if (servers.length) {
			const deepLinkServer = servers[0].id;
			if (!token) {
				Navigation.startSingleScreenApp({
					screen: {
						screen: 'ListServerView',
						title: I18n.t('Servers')
					}
				});
				yield put(selectServer(deepLinkServer));
			} else {
				yield put(selectServer(deepLinkServer));
				yield take(types.METEOR.REQUEST);
				yield navigate({ params, sameServer: false });
			}
		} else {
			yield put(addServer(host));
		}
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;

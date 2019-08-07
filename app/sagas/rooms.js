import {
	put, select, race, take, fork, cancel, takeLatest, delay
} from 'redux-saga/effects';
import { BACKGROUND, INACTIVE } from 'redux-enhancer-react-native-appstate';

import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure } from '../actions/rooms';
import database from '../lib/realm';
import log from '../utils/log';
import mergeSubscriptionsRooms from '../lib/methods/helpers/mergeSubscriptionsRooms';
import RocketChat from '../lib/rocketchat';

let roomsSub;

const removeSub = function removeSub() {
	if (roomsSub && roomsSub.stop) {
		roomsSub.stop();
	}
};

const handleRoomsRequest = function* handleRoomsRequest() {
	try {
		removeSub();
		roomsSub = yield RocketChat.subscribeRooms();
		const newRoomsUpdatedAt = new Date();
		const server = yield select(state => state.server.server);
		const [serverRecord] = database.databases.serversDB.objects('servers').filtered('id = $0', server);
		const { roomsUpdatedAt } = serverRecord;
		const [subscriptionsResult, roomsResult] = yield RocketChat.getRooms(roomsUpdatedAt);
		const { subscriptions } = mergeSubscriptionsRooms(subscriptionsResult, roomsResult);

		database.write(() => {
			subscriptions.forEach((subscription) => {
				try {
					database.create('subscriptions', subscription, true);
				} catch (error) {
					log('err_rooms_request_create_sub', error);
				}
			});
		});
		database.databases.serversDB.write(() => {
			try {
				database.databases.serversDB.create('servers', { id: server, roomsUpdatedAt: newRoomsUpdatedAt }, true);
			} catch (e) {
				log('err_rooms_request_update', e);
			}
		});

		yield put(roomsSuccess());
	} catch (e) {
		yield put(roomsFailure(e));
		log('err_rooms_request', e);
	}
};

const handleLogout = function handleLogout() {
	removeSub();
};

const root = function* root() {
	yield takeLatest(types.LOGOUT, handleLogout);
	while (true) {
		const params = yield take(types.ROOMS.REQUEST);
		const isAuthenticated = yield select(state => state.login.isAuthenticated);
		if (isAuthenticated) {
			const roomsRequestTask = yield fork(handleRoomsRequest, params);
			yield race({
				roomsSuccess: take(types.ROOMS.SUCCESS),
				roomsFailure: take(types.ROOMS.FAILURE),
				serverReq: take(types.SERVER.SELECT_REQUEST),
				background: take(BACKGROUND),
				inactive: take(INACTIVE),
				logout: take(types.LOGOUT),
				timeout: delay(30000)
			});
			yield cancel(roomsRequestTask);
		}
	}
};
export default root;

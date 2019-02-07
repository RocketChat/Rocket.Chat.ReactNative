import { put, takeLatest } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure } from '../actions/rooms';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import log from '../utils/log';
import mergeSubscriptionsRooms from '../lib/methods/helpers/mergeSubscriptionsRooms';

const handleRoomsRequest = function* handleRoomsRequest() {
	try {
		const [subscriptionsResult, roomsResult] = yield RocketChat.getRooms();
		const { subscriptions } = mergeSubscriptionsRooms(subscriptionsResult, roomsResult);

		database.write(() => {
			subscriptions.forEach(subscription => database.create('subscriptions', subscription, true));
		});
		yield put(roomsSuccess());
	} catch (e) {
		yield put(roomsFailure(e));
		log('handleRoomsRequest', e);
	}
};

const root = function* root() {
	yield takeLatest(types.ROOMS.REQUEST, handleRoomsRequest);
};
export default root;

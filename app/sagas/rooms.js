import { put, takeLatest } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure } from '../actions/rooms';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import mergeSubscriptionsRooms from '../lib/methods/helpers/mergeSubscriptionsRooms';
import { appDatabase } from '../lib/database';
import { createSubscription } from '../lib/database/helpers/subscriptions';

const handleRoomsRequest = function* handleRoomsRequest() {
	try {
		const [subscriptionsResult, roomsResult] = yield RocketChat.getRooms();
		const { subscriptions } = mergeSubscriptionsRooms(subscriptionsResult, roomsResult);

		const dbActions = [];
		subscriptions.forEach((subscription) => {
			dbActions.push(createSubscription(appDatabase, subscription));
		});
		yield Promise.all(dbActions);

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

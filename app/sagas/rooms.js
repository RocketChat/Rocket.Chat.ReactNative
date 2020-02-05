import {
	put, select, race, take, fork, cancel, delay
} from 'redux-saga/effects';
import { BACKGROUND, INACTIVE } from 'redux-enhancer-react-native-appstate';
import { Q } from '@nozbe/watermelondb';

import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure } from '../actions/rooms';
import database from '../lib/database';
import log from '../utils/log';
import mergeSubscriptionsRooms from '../lib/methods/helpers/mergeSubscriptionsRooms';
import RocketChat from '../lib/rocketchat';

const updateRooms = function* updateRooms({ server, newRoomsUpdatedAt }) {
	const serversDB = database.servers;
	const serversCollection = serversDB.collections.get('servers');
	const serverRecord = yield serversCollection.find(server);

	return serversDB.action(async() => {
		await serverRecord.update((record) => {
			record.roomsUpdatedAt = newRoomsUpdatedAt;
		});
	});
};

const handleRoomsRequest = function* handleRoomsRequest() {
	try {
		const serversDB = database.servers;
		yield RocketChat.subscribeRooms();
		const newRoomsUpdatedAt = new Date();
		const server = yield select(state => state.server.server);
		const serversCollection = serversDB.collections.get('servers');
		const serverRecord = yield serversCollection.find(server);
		const { roomsUpdatedAt } = serverRecord;
		const [subscriptionsResult, roomsResult] = yield RocketChat.getRooms(roomsUpdatedAt);
		const { subscriptions } = mergeSubscriptionsRooms(subscriptionsResult, roomsResult);

		const db = database.active;
		const subCollection = db.collections.get('subscriptions');

		if (subscriptions.length) {
			const subsIds = subscriptions.map(sub => sub.rid);
			const existingSubs = yield subCollection.query(Q.where('id', Q.oneOf(subsIds))).fetch();
			const subsToUpdate = existingSubs.filter(i1 => subscriptions.find(i2 => i1._id === i2._id));
			const subsToCreate = subscriptions.filter(i1 => !existingSubs.find(i2 => i1._id === i2._id));
			// TODO: subsToDelete?

			const allRecords = [
				...subsToCreate.map(subscription => subCollection.prepareCreate((s) => {
					s._raw = sanitizedRaw({ id: subscription.rid }, subCollection.schema);
					return Object.assign(s, subscription);
				})),
				...subsToUpdate.map((subscription) => {
					const newSub = subscriptions.find(s => s._id === subscription._id);
					return subscription.prepareUpdate(() => {
						Object.assign(subscription, newSub);
					});
				})
			];

			yield db.action(async() => {
				await db.batch(...allRecords);
			});
		}

		yield updateRooms({ server, newRoomsUpdatedAt });
		yield put(roomsSuccess());
	} catch (e) {
		yield put(roomsFailure(e));
		log(e);
	}
};

const root = function* root() {
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

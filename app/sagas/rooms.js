import {
	put,
	select,
	race,
	take,
	fork,
	cancel,
	takeLatest,
	delay
} from 'redux-saga/effects';
import { BACKGROUND, INACTIVE } from 'redux-enhancer-react-native-appstate';

import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure } from '../actions/rooms';
import database from '../lib/realm';
import watermelondb from '../lib/database';
import log from '../utils/log';
import mergeSubscriptionsRooms from '../lib/methods/helpers/mergeSubscriptionsRooms';
import RocketChat from '../lib/rocketchat';

let roomsSub;

const removeSub = function removeSub() {
	if (roomsSub && roomsSub.stop) {
		roomsSub.stop();
	}
};

// TODO: move to utils
const assignSub = (sub, newSub) => {
	Object.assign(sub, newSub);
};

const handleRoomsRequest = function* handleRoomsRequest() {
	try {
		removeSub();
		roomsSub = yield RocketChat.subscribeRooms();
		const newRoomsUpdatedAt = new Date();
		const server = yield select(state => state.server.server);
		const [serverRecord] = database.databases.serversDB
			.objects('servers')
			.filtered('id = $0', server);
		const { roomsUpdatedAt } = serverRecord;
		const [subscriptionsResult, roomsResult] = yield RocketChat.getRooms(
			roomsUpdatedAt
		);
		const { subscriptions } = mergeSubscriptionsRooms(
			subscriptionsResult,
			roomsResult
		);

		database.write(() => {
			subscriptions.forEach((subscription) => {
				try {
					database.create('subscriptions', subscription, true);
				} catch (error) {
					log('err_rooms_request_create_sub', error);
				}
			});
		});
		const watermelon = watermelondb.database;
		yield watermelon.action(async(action) => {
			const subCollection = watermelon.collections.get('subscriptions');
			const existingSubs = await subCollection.query().fetch();
			const subsToUpdate = existingSubs.filter(i1 => subscriptions.find(i2 => i1.id === i2._id));
			const subsToCreate = subscriptions.filter(
				i1 => !existingSubs.find(i2 => i1._id === i2.id)
			);
			// TODO: subsToDelete?

			const allRecords = [
				...subsToCreate.map(subscription => subCollection.prepareCreate((s) => {
					s._raw = sanitizedRaw(
						{
							id: subscription._id
						},
						subCollection.schema
					);
					return assignSub(s, subscription);
				})),
				...subsToUpdate.map((subscription) => {
					const newSub = subscriptions.find(
						s => s._id === subscription.id
					);
					return subscription.prepareUpdate(() => {
						assignSub(subscription, newSub);
					});
				})
			];

			try {
				await watermelon.batch(...allRecords);
			} catch (e) {
				console.log('TCL: batch watermelon -> e', e);
			}
			return allRecords.length;
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
		const isAuthenticated = yield select(
			state => state.login.isAuthenticated
		);
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

console.disableYellowBox = true;

import { put, takeLatest } from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure } from '../actions/rooms';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import log from '../utils/log';
import mergeSubscriptionsRooms from '../lib/methods/helpers/mergeSubscriptionsRooms';
import { appDatabase } from '../lib/database';

const handleRoomsRequest = function* handleRoomsRequest() {
	try {
		const [subscriptionsResult, roomsResult] = yield RocketChat.getRooms();
		const { subscriptions } = mergeSubscriptionsRooms(subscriptionsResult, roomsResult);
		console.log('TCL: handleRoomsRequest -> subscriptions', subscriptions);

		// database.write(() => {
		// 	subscriptions.forEach(subscription => database.create('subscriptions', subscription, true));
		// });
		const subscriptionsCollection = appDatabase.collections.get('subscriptions');
		// yield subscriptionsCollection.query().destroyAllPermanently();
		// const emojisAliasesCollection = appDatabase.collections.get('custom_emojis_aliases');
		const records = [];
		const operations = [];
		subscriptions.forEach((subscription) => {
			records.push(appDatabase.action(async() => {
				let subscriptionRecord;
				try {
					subscriptionRecord = await subscriptionsCollection.find(subscription.id);
					// console.log('TCL: handleRoomsRequest -> subscriptionRecord', subscriptionRecord);
					operations.push(subscriptionRecord.prepareUpdate((s) => {
						s._raw = sanitizedRaw({
							...subscription
						}, subscriptionsCollection.schema);
					}));
				} catch (error) {
					operations.push(subscriptionsCollection.prepareCreate((s) => {
						s._raw = sanitizedRaw({
							...subscription
						}, subscriptionsCollection.schema);
					}));
				}
			}));
		});
		yield Promise.all(records);
		yield appDatabase.batch(...operations);

		yield put(roomsSuccess());
	} catch (e) {
		yield put(roomsFailure(e));
		// log('handleRoomsRequest', e);
		alert(e)
	}
};

const root = function* root() {
	yield takeLatest(types.ROOMS.REQUEST, handleRoomsRequest);
};
export default root;

import {
	put, select, race, take, fork, cancel, delay
} from 'redux-saga/effects';
import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import * as types from '../actions/actionsTypes';
import { roomsSuccess, roomsFailure, roomsRefresh } from '../actions/rooms';
import database from '../lib/database';
import log from '../utils/log';
import mergeSubscriptionsRooms from '../lib/methods/helpers/mergeSubscriptionsRooms';
import RocketChat from '../lib/rocketchat';
import buildMessage from '../lib/methods/helpers/buildMessage';
import protectedFunction from '../lib/methods/helpers/protectedFunction';

const updateRooms = function* updateRooms({ server, newRoomsUpdatedAt }) {
	const serversDB = database.servers;
	const serversCollection = serversDB.collections.get('servers');
	try {
		const serverRecord = yield serversCollection.find(server);

		return serversDB.action(async() => {
			await serverRecord.update((record) => {
				record.roomsUpdatedAt = newRoomsUpdatedAt;
			});
		});
	} catch {
		// Server not found
	}
};

const handleRoomsRequest = function* handleRoomsRequest({ params }) {
	try {
		const serversDB = database.servers;
		RocketChat.subscribeRooms();
		const newRoomsUpdatedAt = new Date();
		let roomsUpdatedAt;
		const server = yield select(state => state.server.server);
		if (params.allData) {
			yield put(roomsRefresh());
		} else {
			const serversCollection = serversDB.collections.get('servers');
			try {
				const serverRecord = yield serversCollection.find(server);
				({ roomsUpdatedAt } = serverRecord);
			} catch {
				// Server not found
			}
		}
		const [subscriptionsResult, roomsResult] = yield RocketChat.getRooms(roomsUpdatedAt);
		const { subscriptions } = yield mergeSubscriptionsRooms(subscriptionsResult, roomsResult);

		const db = database.active;
		const subCollection = db.collections.get('subscriptions');
		const messagesCollection = db.collections.get('messages');

		const subsIds = subscriptions.map(sub => sub.rid).concat(roomsResult.remove.map(room => room._id));
		if (subsIds.length) {
			const existingSubs = yield subCollection.query(Q.where('id', Q.oneOf(subsIds))).fetch();
			const subsToUpdate = existingSubs.filter(i1 => subscriptions.find(i2 => i1._id === i2._id));
			const subsToCreate = subscriptions.filter(i1 => !existingSubs.find(i2 => i1._id === i2._id));
			const subsToDelete = existingSubs.filter(i1 => !subscriptions.find(i2 => i1._id === i2._id));

			const lastMessages = subscriptions
				.map(sub => sub.lastMessage && buildMessage(sub.lastMessage))
				.filter(lm => lm);
			const lastMessagesIds = lastMessages.map(lm => lm._id);
			const existingMessages = yield messagesCollection.query(Q.where('id', Q.oneOf(lastMessagesIds))).fetch();
			const messagesToUpdate = existingMessages.filter(i1 => lastMessages.find(i2 => i1.id === i2._id));
			const messagesToCreate = lastMessages.filter(i1 => !existingMessages.find(i2 => i1._id === i2.id));

			const allRecords = [
				...subsToCreate.map(subscription => subCollection.prepareCreate((s) => {
					s._raw = sanitizedRaw({ id: subscription.rid }, subCollection.schema);
					return Object.assign(s, subscription);
				})),
				...subsToUpdate.map((subscription) => {
					const newSub = subscriptions.find(s => s._id === subscription._id);
					return subscription.prepareUpdate(() => {
						if (newSub.announcement) {
							if (newSub.announcement !== subscription.announcement) {
								subscription.bannerClosed = false;
							}
						}
						Object.assign(subscription, newSub);
					});
				}),
				...subsToDelete.map(subscription => subscription.prepareDestroyPermanently()),
				...messagesToCreate.map(message => messagesCollection.prepareCreate(protectedFunction((m) => {
					m._raw = sanitizedRaw({ id: message._id }, messagesCollection.schema);
					m.subscription.id = message.rid;
					return Object.assign(m, message);
				}))),
				...messagesToUpdate.map((message) => {
					const newMessage = lastMessages.find(m => m._id === message.id);
					return message.prepareUpdate(protectedFunction(() => {
						Object.assign(message, newMessage);
					}));
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
				background: take(types.APP_STATE.BACKGROUND),
				logout: take(types.LOGOUT),
				timeout: delay(30000)
			});
			yield cancel(roomsRequestTask);
		}
	}
};
export default root;

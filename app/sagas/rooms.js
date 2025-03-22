import { cancel, delay, fork, put, race, select, take } from 'redux-saga/effects';
import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import * as types from '../actions/actionsTypes';
import { roomsFailure, roomsRefresh, roomsSuccess } from '../actions/rooms';
import database from '../lib/database';
import log from '../lib/methods/helpers/log';
import mergeSubscriptionsRooms from '../lib/methods/helpers/mergeSubscriptionsRooms';
import buildMessage from '../lib/methods/helpers/buildMessage';
import { getRooms, subscribeRooms } from '../lib/methods';

const updateRooms = function* updateRooms({ server, newRoomsUpdatedAt }) {
	const serversDB = database.servers;
	const serversCollection = serversDB.get('servers');
	try {
		const serverRecord = yield serversCollection.find(server);

		return serversDB.write(async () => {
			await serverRecord.update(record => {
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
		subscribeRooms();
		const newRoomsUpdatedAt = new Date();
		let roomsUpdatedAt;
		const server = yield select(state => state.server.server);
		if (params.allData) {
			yield put(roomsRefresh());
		} else {
			const serversCollection = serversDB.get('servers');
			try {
				const serverRecord = yield serversCollection.find(server);
				({ roomsUpdatedAt } = serverRecord);
			} catch {
				// Server not found
			}
		}

		const [subscriptionsResult, roomsResult] = yield getRooms(roomsUpdatedAt);
		const subscriptions = yield mergeSubscriptionsRooms(subscriptionsResult, roomsResult);
		const db = database.active;
		const subCollection = db.get('subscriptions');
		const messagesCollection = db.get('messages');

		const subsIds = subscriptions.map(sub => sub._id).concat(subscriptionsResult.remove.map(sub => sub._id));
		if (subsIds.length) {
			const existingSubs = yield subCollection.query(Q.where('_id', Q.oneOf(subsIds))).fetch();
			const subsToUpdate = existingSubs.filter(i1 => subscriptions.find(i2 => i1._id === i2._id));
			const subsToCreate = subscriptions.filter(i1 => !existingSubs.find(i2 => i1._id === i2._id));
			const subsToDelete = existingSubs.filter(i1 => !subscriptions.find(i2 => i1._id === i2._id));

			const subscribedRoom = yield select(state => state.room.subscribedRoom);
			const lastMessages = subscriptions
				/** Checks for opened rooms and filter them out.
				 * It prevents this process to try persisting the same last message on the room messages fetch.
				 * This race condition is easy to reproduce on push notification tap.
				 */
				.filter(sub => subscribedRoom !== sub.rid)
				.map(sub => sub.lastMessage && buildMessage(sub.lastMessage))
				.filter(lm => lm && lm._id && lm.rid);
			const lastMessagesIds = lastMessages.map(lm => lm._id).filter(lm => lm);
			const existingMessages = yield messagesCollection.query(Q.where('id', Q.oneOf(lastMessagesIds))).fetch();
			const messagesToUpdate = existingMessages.filter(i1 => lastMessages.find(i2 => i1.id === i2._id));
			const messagesToCreate = lastMessages.filter(i1 => !existingMessages.find(i2 => i1._id === i2.id));

			const allRecords = [
				...subsToCreate.map(subscription =>
					subCollection.prepareCreate(s => {
						s._raw = sanitizedRaw({ id: subscription.rid }, subCollection.schema);
						return Object.assign(s, subscription);
					})
				),
				...subsToUpdate.map(subscription => {
					try {
						const newSub = subscriptions.find(s => s._id === subscription._id);
						return subscription.prepareUpdate(() => {
							if (newSub.announcement) {
								if (newSub.announcement !== subscription.announcement) {
									subscription.bannerClosed = false;
								}
							}
							Object.assign(subscription, newSub);
						});
					} catch (e) {
						log(e);
						return null;
					}
				}),
				...subsToDelete.map(subscription => {
					try {
						return subscription.prepareDestroyPermanently();
					} catch (e) {
						log(e);
						return null;
					}
				}),
				...messagesToCreate.map(message =>
					messagesCollection.prepareCreate(m => {
						m._raw = sanitizedRaw({ id: message._id }, messagesCollection.schema);
						m.subscription.id = message.rid;
						return Object.assign(m, message);
					})
				),
				...messagesToUpdate.map(message => {
					const newMessage = lastMessages.find(m => m._id === message.id);
					return message.prepareUpdate(() => {
						try {
							return Object.assign(message, newMessage);
						} catch (e) {
							log(e);
							return null;
						}
					});
				})
			];

			yield db.write(async () => {
				await db.batch(allRecords);
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

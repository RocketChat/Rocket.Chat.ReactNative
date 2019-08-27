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

const assignSub = (sub, newSub) => {
	// sub.t = newSub.t;
	// sub.ts = newSub.ts;
	// sub.ls = newSub.ls;
	// sub.name = newSub.name;
	// sub.fname = newSub.fname;
	// sub.rid = newSub.rid;
	// sub.open = newSub.open;
	// sub.alert = newSub.alert;
	// sub.unread = newSub.unread;
	// sub.userMentions = newSub.userMentions;
	// sub.roomUpdatedAt = newSub.roomUpdatedAt;
	// sub.ro = newSub.ro;
	// sub.lastOpen = newSub.lastOpen;
	// sub.description = newSub.description;
	// sub.announcement = newSub.announcement;
	// sub.topic = newSub.topic;
	// sub.blocked = newSub.blocked;
	// sub.blocker = newSub.blocker;
	// sub.reactWhenReadOnly = newSub.reactWhenReadOnly;
	// sub.archived = newSub.archived;
	// sub.joinCodeRequired = newSub.joinCodeRequired;
	// sub.notifications = newSub.notifications;
	// sub.broadcast = newSub.broadcast;
	// sub.prid = newSub.prid;
	// sub.draftMessage = newSub.draftMessage;
	// sub.lastThreadSync = newSub.lastThreadSync;
	// sub.autoTranslate = newSub.autoTranslate;
	// sub.autoTranslateLanguage = newSub.autoTranslateLanguage;
	// if (newSub.lastMessage) {
    //     // console.log('TCL: assignSub -> newSub.lastMessage', newSub.lastMessage);
	// 	sub.lastMessage = newSub.lastMessage;
	// 	// sub.tempLastMessage = newSub.lastMessage;
	// }
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
		console.log('ACTION ACTION ACTION ACTION ACTION ACTION ')
		yield watermelon.action(async(action) => {
			// await action.subAction(() => watermelon.unsafeResetDatabase());
			const subCollection = watermelon.collections.get('subscriptions');
			const messageCollection = watermelon.collections.get('messages');
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
				}),
			];

			// const allMessages = [];
			// allRecords.forEach(sub => {
            // 	// console.log('TCL: handleRoomsRequest -> sub', sub.lastMessage);
			// 	if (sub.lastMessage.id) {
            //         // console.log('TCL: handleRoomsRequest -> sub.lastMessage', sub.tempLastMessage);
			// 		allMessages.push(
			// 			messageCollection.prepareCreate((message) => {
			// 				message._raw = sanitizedRaw(
			// 					{
			// 						id: sub.lastMessage.id
			// 					},
			// 					messageCollection.schema
			// 				);
			// 				message.subscription.set(sub)
			// 				message.msg = sub.tempLastMessage.msg;
			// 				message.u = sub.tempLastMessage.u;
			// 			})
			// 		);
			// 	}
			// })
            // console.log('TCL: handleRoomsRequest -> allMessages', allMessages);

			try {
				await watermelon.batch(
					...allRecords,
					// ...allMessages
				);
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
		// yield put(roomsFailure(e));
		// log('err_rooms_request', e);
		alert(e)
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

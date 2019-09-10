import { takeLatest, put, call } from 'redux-saga/effects';
import { Q } from '@nozbe/watermelondb';

import Navigation from '../lib/Navigation';
import { MESSAGES } from '../actions/actionsTypes';
import {
	deleteSuccess,
	deleteFailure,
	toggleStarSuccess,
	toggleStarFailure,
	togglePinSuccess,
	togglePinFailure
} from '../actions/messages';
import RocketChat from '../lib/rocketchat';
import watermelon from '../lib/database';
import log from '../utils/log';

const deleteMessage = message => RocketChat.deleteMessage(message);
const toggleStarMessage = message => RocketChat.toggleStarMessage(message);
const togglePinMessage = message => RocketChat.togglePinMessage(message);

const handleDeleteRequest = function* handleDeleteRequest({ message }) {
	try {
		yield call(deleteMessage, message);
		yield put(deleteSuccess());
	} catch (error) {
		yield put(deleteFailure());
	}
};

const handleToggleStarRequest = function* handleToggleStarRequest({ message }) {
	try {
		yield call(toggleStarMessage, message);
		yield put(toggleStarSuccess());
	} catch (error) {
		yield put(toggleStarFailure());
	}
};

const handleTogglePinRequest = function* handleTogglePinRequest({ message }) {
	try {
		yield call(togglePinMessage, message);
		yield put(togglePinSuccess());
	} catch (error) {
		yield put(togglePinFailure(error));
	}
};

const goRoom = function goRoom({ rid, name, message }) {
	Navigation.navigate('RoomsListView');
	Navigation.navigate('RoomView', {
		rid, name, t: 'd', message
	});
};

const handleReplyBroadcast = function* handleReplyBroadcast({ message }) {
	try {
		const { database } = watermelon;
		const { username } = message.u;
		const subsCollection = database.collections.get('subscriptions');
		const subscriptions = yield subsCollection.query(Q.where('name', username)).fetch();
		if (subscriptions.length) {
			yield goRoom({ rid: subscriptions[0].rid, name: username, message });
		} else {
			const room = yield RocketChat.createDirectMessage(username);
			yield goRoom({ rid: room.rid, name: username, message });
		}
	} catch (e) {
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(MESSAGES.DELETE_REQUEST, handleDeleteRequest);
	yield takeLatest(MESSAGES.TOGGLE_STAR_REQUEST, handleToggleStarRequest);
	yield takeLatest(MESSAGES.TOGGLE_PIN_REQUEST, handleTogglePinRequest);
	yield takeLatest(MESSAGES.REPLY_BROADCAST, handleReplyBroadcast);
};
export default root;

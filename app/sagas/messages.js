import { delay } from 'redux-saga';
import { takeLatest, put, call } from 'redux-saga/effects';

import Navigation from '../lib/Navigation';
import { MESSAGES } from '../actions/actionsTypes';
import {
	deleteSuccess,
	deleteFailure,
	editSuccess,
	editFailure,
	toggleStarSuccess,
	toggleStarFailure,
	togglePinSuccess,
	togglePinFailure,
	replyInit
} from '../actions/messages';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import log from '../utils/log';

const deleteMessage = message => RocketChat.deleteMessage(message);
const editMessage = message => RocketChat.editMessage(message);
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

const handleEditRequest = function* handleEditRequest({ message }) {
	try {
		yield call(editMessage, message);
		yield put(editSuccess());
	} catch (error) {
		yield put(editFailure());
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

const goRoom = function goRoom({ rid, name }) {
	Navigation.navigate('RoomsListView');
	Navigation.navigate('RoomView', { rid, name, t: 'd' });
};

const handleReplyBroadcast = function* handleReplyBroadcast({ message }) {
	try {
		const { username } = message.u;
		const subscriptions = database.objects('subscriptions').filtered('name = $0', username);
		if (subscriptions.length) {
			yield goRoom({ rid: subscriptions[0].rid, name: username });
		} else {
			const room = yield RocketChat.createDirectMessage(username);
			yield goRoom({ rid: room.rid, name: username });
		}
		yield delay(500);
		yield put(replyInit(message, false));
	} catch (e) {
		log('handleReplyBroadcast', e);
	}
};

const root = function* root() {
	yield takeLatest(MESSAGES.DELETE_REQUEST, handleDeleteRequest);
	yield takeLatest(MESSAGES.EDIT_REQUEST, handleEditRequest);
	yield takeLatest(MESSAGES.TOGGLE_STAR_REQUEST, handleToggleStarRequest);
	yield takeLatest(MESSAGES.TOGGLE_PIN_REQUEST, handleTogglePinRequest);
	yield takeLatest(MESSAGES.REPLY_BROADCAST, handleReplyBroadcast);
};
export default root;

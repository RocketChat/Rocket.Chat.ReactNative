import { delay } from 'redux-saga';
import { takeLatest, put, call, select } from 'redux-saga/effects';
import { MESSAGES } from '../actions/actionsTypes';
import {
	messagesSuccess,
	messagesFailure,
	deleteSuccess,
	deleteFailure,
	editSuccess,
	editFailure,
	toggleStarSuccess,
	toggleStarFailure,
	permalinkSuccess,
	permalinkFailure,
	togglePinSuccess,
	togglePinFailure,
	setInput
} from '../actions/messages';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import { goRoom } from '../containers/routes/NavigationService';
import log from '../utils/log';

const deleteMessage = message => RocketChat.deleteMessage(message);
const editMessage = message => RocketChat.editMessage(message);
const toggleStarMessage = message => RocketChat.toggleStarMessage(message);
const getPermalink = message => RocketChat.getPermalink(message);
const togglePinMessage = message => RocketChat.togglePinMessage(message);

const get = function* get({ room }) {
	try {
		if (room.lastOpen) {
			yield RocketChat.loadMissedMessages(room);
		} else {
			yield RocketChat.loadMessagesForRoom(room);
		}
		yield put(messagesSuccess());
	} catch (err) {
		console.warn('messagesFailure', err);
		yield put(messagesFailure(err.status));
	}
};

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

const handlePermalinkRequest = function* handlePermalinkRequest({ message }) {
	try {
		const permalink = yield call(getPermalink, message);
		yield put(permalinkSuccess(permalink));
	} catch (error) {
		yield put(permalinkFailure(error));
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

const handleReplyBroadcast = function* handleReplyBroadcast({ message }) {
	try {
		const { username } = message.u;
		const subscriptions = database.objects('subscriptions').filtered('name = $0', username);
		if (subscriptions.length) {
			goRoom({ rid: subscriptions[0].rid, name: subscriptions[0].name });
		} else {
			const room = yield RocketChat.createDirectMessage(username);
			goRoom({ rid: room.rid, name: username });
		}
		yield delay(100);
		const server = yield select(state => state.server.server);
		const msg = `[ ](${ server }/direct/${ username }?msg=${ message._id })`;
		yield put(setInput({ msg }));
	} catch (e) {
		log('handleReplyBroadcast', e);
	}
};

const root = function* root() {
	yield takeLatest(MESSAGES.REQUEST, get);
	yield takeLatest(MESSAGES.DELETE_REQUEST, handleDeleteRequest);
	yield takeLatest(MESSAGES.EDIT_REQUEST, handleEditRequest);
	yield takeLatest(MESSAGES.TOGGLE_STAR_REQUEST, handleToggleStarRequest);
	yield takeLatest(MESSAGES.PERMALINK_REQUEST, handlePermalinkRequest);
	yield takeLatest(MESSAGES.TOGGLE_PIN_REQUEST, handleTogglePinRequest);
	yield takeLatest(MESSAGES.REPLY_BROADCAST, handleReplyBroadcast);
};
export default root;

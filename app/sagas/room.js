import { Alert } from 'react-native';
import {
	call, takeLatest, take, select, takeEvery
} from 'redux-saga/effects';
import { delay } from 'redux-saga';
import EJSON from 'ejson';

import Navigation from '../lib/Navigation';
import * as types from '../actions/actionsTypes';
import { messagesRequest, editCancel, replyCancel } from '../actions/messages';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import log from '../utils/log';
import I18n from '../i18n';

const handleMessageReceived = function* handleMessageReceived({ message }) {
	try {
		const room = yield select(state => state.room);

		if (message.rid === room.rid) {
			database.write(() => {
				database.create('messages', EJSON.fromJSONValue(message), true);
			});

			if (room._id) {
				RocketChat.readMessages(room.rid);
			}
		}
	} catch (e) {
		console.warn('handleMessageReceived', e);
	}
};

const watchUserTyping = function* watchUserTyping({ rid, status }) {
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		yield take(types.LOGIN.SUCCESS);
	}

	try {
		yield RocketChat.emitTyping(rid, status);

		if (status) {
			yield call(delay, 5000);
			yield RocketChat.emitTyping(rid, false);
		}
	} catch (e) {
		log('watchUserTyping', e);
	}
};

const handleLeaveRoom = function* handleLeaveRoom({ rid, t }) {
	try {
		const result = yield RocketChat.leaveRoom(rid, t);
		if (result.success) {
			yield Navigation.navigate('RoomsListView');
		}
	} catch (e) {
		if (e.data && e.data.errorType === 'error-you-are-last-owner') {
			Alert.alert(I18n.t('Oops'), I18n.t(e.data.errorType));
		} else {
			Alert.alert(I18n.t('Oops'), I18n.t('There_was_an_error_while_action', { action: I18n.t('leaving_room') }));
		}
	}
};

const handleEraseRoom = function* handleEraseRoom({ rid, t }) {
	try {
		const result = yield RocketChat.eraseRoom(rid, t);
		if (result.success) {
			yield Navigation.navigate('RoomsListView');
		}
	} catch (e) {
		Alert.alert(I18n.t('Oops'), I18n.t('There_was_an_error_while_action', { action: I18n.t('erasing_room') }));
	}
};

const root = function* root() {
	yield takeLatest(types.ROOM.USER_TYPING, watchUserTyping);
	yield takeEvery(types.ROOM.MESSAGE_RECEIVED, handleMessageReceived);
	yield takeLatest(types.ROOM.LEAVE, handleLeaveRoom);
	yield takeLatest(types.ROOM.ERASE, handleEraseRoom);
};
export default root;

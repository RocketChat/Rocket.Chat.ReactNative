import { Alert } from 'react-native';
import { delay, put, race, select, take, takeLatest, actionChannel, throttle, fork, cancel } from 'redux-saga/effects';

import EventEmitter from '../lib/methods/helpers/events';
import Navigation from '../lib/navigation/appNavigation';
import * as types from '../actions/actionsTypes';
import { removedRoom } from '../actions/room';
import log, { events, logEvent } from '../lib/methods/helpers/log';
import I18n from '../i18n';
import { showErrorAlert } from '../lib/methods/helpers/info';
import { LISTENER } from '../containers/Toast';
import { Services } from '../lib/services';
import getMoreMessages from '../lib/methods/getMoreMessages';
import { getMessageById } from '../lib/database/services/Message';

function* watchHistoryRequests() {
	const requestChan = yield actionChannel(types.ROOM.HISTORY_REQUEST);
	while (true) {
		const { rid, t, tmid, loaderId } = yield take(requestChan);

		const loaderItem = yield getMessageById(loaderId);
		if (loaderItem) {
			try {
				yield getMoreMessages({ rid, t, tmid, loaderItem });
			} catch (e) {
				log(e);
			} finally {
				yield put({ type: types.ROOM.HISTORY_FINISHED, loaderId });
			}
		}
	}
}

let inactiveTypingTask = null;

const clearUserTyping = function* clearUserTyping({ rid, status }) {
	try {
		if (!status) {
			yield Services.emitTyping(rid, false);
			if (inactiveTypingTask) {
				yield cancel(inactiveTypingTask);
			}
		}
	} catch (e) {
		log(e);
	}
};

const clearInactiveTyping = function* clearInactiveTyping({ rid }) {
	yield delay(5000);
	yield clearUserTyping({ rid, status: false });
};

const watchUserTyping = function* watchUserTyping({ rid, status }) {
	try {
		if (status) {
			yield Services.emitTyping(rid, status);
			if (inactiveTypingTask) {
				yield cancel(inactiveTypingTask);
			}
			inactiveTypingTask = yield fork(clearInactiveTyping, { rid });
		}
	} catch (e) {
		log(e);
	}
};

const handleRemovedRoom = function* handleRemovedRoom(roomType, actionType) {
	const isMasterDetail = yield select(state => state.app.isMasterDetail);
	if (isMasterDetail) {
		yield Navigation.navigate('DrawerNavigator');
	} else {
		yield Navigation.navigate('RoomsListView');
	}

	if (actionType === 'leave') {
		EventEmitter.emit(LISTENER, {
			message: roomType === 'team' ? I18n.t('Left_The_Team_Successfully') : I18n.t('Left_The_Room_Successfully')
		});
	}
	if (actionType === 'delete') {
		EventEmitter.emit(LISTENER, {
			message: roomType === 'team' ? I18n.t('Deleted_The_Team_Successfully') : I18n.t('Deleted_The_Room_Successfully')
		});
	}

	// types.ROOM.REMOVE is triggered by `subscriptions-changed` with `removed` arg
	const { timeout } = yield race({
		deleteFinished: take(types.ROOM.REMOVED),
		timeout: delay(3000)
	});
	if (timeout) {
		put(removedRoom());
	}
};

const handleLeaveRoom = function* handleLeaveRoom({ room, roomType, selected }) {
	logEvent(events.RA_LEAVE);
	try {
		let result = {};

		if (roomType === 'channel') {
			result = yield Services.leaveRoom(room.rid, room.t);
		} else if (roomType === 'team') {
			result = yield Services.leaveTeam({ teamId: room.teamId, ...(selected && { rooms: selected }) });
		}

		if (result?.success) {
			yield handleRemovedRoom(roomType, 'leave');
		}
	} catch (e) {
		logEvent(events.RA_LEAVE_F);
		if (e.data && e.data.errorType === 'error-you-are-last-owner') {
			Alert.alert(I18n.t('Oops'), I18n.t(e.data.errorType));
		} else if (e?.data?.error === 'last-owner-can-not-be-removed') {
			Alert.alert(I18n.t('Oops'), I18n.t(e.data.error));
		} else {
			Alert.alert(I18n.t('Oops'), I18n.t('There_was_an_error_while_action', { action: I18n.t('leaving_room') }));
		}
	}
};

const handleDeleteRoom = function* handleDeleteRoom({ room, roomType, selected }) {
	logEvent(events.RI_EDIT_DELETE);
	try {
		let result = {};

		if (roomType === 'channel') {
			result = yield Services.deleteRoom(room.rid || room._id, room.t);
		} else if (roomType === 'team') {
			result = yield Services.deleteTeam({ teamId: room.teamId, ...(selected && { roomsToRemove: selected }) });
		}

		if (result?.success) {
			yield handleRemovedRoom(roomType, 'delete');
		}
	} catch (e) {
		logEvent(events.RI_EDIT_DELETE_F);
		Alert.alert(
			I18n.t('Oops'),
			I18n.t('There_was_an_error_while_action', {
				action: roomType === 'team' ? I18n.t('deleting_team') : I18n.t('deleting_room')
			})
		);
	}
};

const handleForwardRoom = function* handleForwardRoom({ transferData }) {
	try {
		const result = yield Services.forwardLivechat(transferData);
		if (result === true) {
			const isMasterDetail = yield select(state => state.app.isMasterDetail);
			if (isMasterDetail) {
				Navigation.navigate('DrawerNavigator');
			} else {
				Navigation.navigate('RoomsListView');
			}
		} else {
			showErrorAlert(I18n.t('No_available_agents_to_transfer'), I18n.t('Oops'));
		}
	} catch (e) {
		showErrorAlert(e.reason, I18n.t('Oops'));
	}
};

const root = function* root() {
	yield takeLatest(types.ROOM.USER_TYPING, clearUserTyping);
	yield throttle(3000, types.ROOM.USER_TYPING, watchUserTyping);
	yield takeLatest(types.ROOM.LEAVE, handleLeaveRoom);
	yield takeLatest(types.ROOM.DELETE, handleDeleteRoom);
	yield takeLatest(types.ROOM.FORWARD, handleForwardRoom);
	yield watchHistoryRequests();
};
export default root;

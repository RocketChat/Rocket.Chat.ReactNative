import { Alert } from 'react-native';
import prompt from 'react-native-prompt-android';
import { delay, put, race, select, take, takeLatest } from 'redux-saga/effects';

import EventEmitter from '../utils/events';
import Navigation from '../lib/Navigation';
import * as types from '../actions/actionsTypes';
import { removedRoom } from '../actions/room';
import RocketChat from '../lib/rocketchat';
import log, { events, logEvent } from '../utils/log';
import I18n from '../i18n';
import { showErrorAlert } from '../utils/info';
import { LISTENER } from '../containers/Toast';

const watchUserTyping = function* watchUserTyping({ rid, status }) {
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		yield take(types.LOGIN.SUCCESS);
	}

	try {
		yield RocketChat.emitTyping(rid, status);

		if (status) {
			yield delay(5000);
			yield RocketChat.emitTyping(rid, false);
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
			result = yield RocketChat.leaveRoom(room.rid, room.t);
		} else if (roomType === 'team') {
			result = yield RocketChat.leaveTeam({ teamId: room.teamId, ...(selected && { rooms: selected }) });
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
			result = yield RocketChat.deleteRoom(room.rid, room.t);
		} else if (roomType === 'team') {
			result = yield RocketChat.deleteTeam({ teamId: room.teamId, ...(selected && { roomsToRemove: selected }) });
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

const handleCloseRoom = function* handleCloseRoom({ rid }) {
	const isMasterDetail = yield select(state => state.app.isMasterDetail);
	const requestComment = yield select(state => state.settings.Livechat_request_comment_when_closing_conversation);

	const closeRoom = async (comment = '') => {
		try {
			await RocketChat.closeLivechat(rid, comment);
			if (isMasterDetail) {
				Navigation.navigate('DrawerNavigator');
			} else {
				Navigation.navigate('RoomsListView');
			}
		} catch {
			// do nothing
		}
	};

	if (!requestComment) {
		const comment = I18n.t('Chat_closed_by_agent');
		return closeRoom(comment);
	}

	prompt(
		I18n.t('Closing_chat'),
		I18n.t('Please_add_a_comment'),
		[
			{ text: I18n.t('Cancel'), onPress: () => {}, style: 'cancel' },
			{
				text: I18n.t('Submit'),
				onPress: comment => closeRoom(comment)
			}
		],
		{
			cancelable: true
		}
	);
};

const handleForwardRoom = function* handleForwardRoom({ transferData }) {
	try {
		const result = yield RocketChat.forwardLivechat(transferData);
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
	yield takeLatest(types.ROOM.USER_TYPING, watchUserTyping);
	yield takeLatest(types.ROOM.LEAVE, handleLeaveRoom);
	yield takeLatest(types.ROOM.DELETE, handleDeleteRoom);
	yield takeLatest(types.ROOM.CLOSE, handleCloseRoom);
	yield takeLatest(types.ROOM.FORWARD, handleForwardRoom);
};
export default root;

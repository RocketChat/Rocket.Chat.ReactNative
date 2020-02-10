import {
	put, takeLatest, delay, select
} from 'redux-saga/effects';
import { Alert } from 'react-native';

import { INVITE_LINKS } from '../actions/actionsTypes';
import { inviteLinksSuccess, inviteLinksFailure, inviteLinksSetInvite } from '../actions/inviteLinks';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import Navigation from '../lib/Navigation';
import I18n from '../i18n';

const handleRequest = function* handleRequest({ token }) {
	try {
		const validateResult = yield RocketChat.validateInviteToken(token);
		if (!validateResult.valid) {
			yield put(inviteLinksFailure());
			return;
		}

		const result = yield RocketChat.useInviteToken(token);
		if (!result.success) {
			yield put(inviteLinksFailure());
			return;
		}

		if (result.room && result.room.rid) {
			yield delay(1000);
			yield Navigation.navigate('RoomsListView');
			const { room } = result;
			Navigation.navigate('RoomView', {
				rid: room.rid,
				name: RocketChat.getRoomTitle(room),
				t: room.t
			});
		}

		yield put(inviteLinksSuccess());
	} catch (e) {
		yield put(inviteLinksFailure());
		log(e);
	}
};

const handleFailure = function handleFailure() {
	Alert.alert(I18n.t('Oops'), I18n.t('Invalid_or_expired_invite_token'));
};

const handleCreateInviteLink = function* handleCreateInviteLink({ rid }) {
	try {
		const inviteLinks = yield select(state => state.inviteLinks);
		const result = yield RocketChat.findOrCreateInvite({
			rid, days: inviteLinks.days, maxUses: inviteLinks.maxUses
		});
		if (!result.success) {
			Alert.alert(I18n.t('Oops'), I18n.t('There_was_an_error_while_action', { action: I18n.t('creating_invite') }));
			return;
		}

		yield put(inviteLinksSetInvite(result));
	} catch (e) {
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(INVITE_LINKS.REQUEST, handleRequest);
	yield takeLatest(INVITE_LINKS.FAILURE, handleFailure);
	yield takeLatest(INVITE_LINKS.CREATE, handleCreateInviteLink);
};

export default root;

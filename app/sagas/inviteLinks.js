import {
	select, put, call, take, takeLatest
} from 'redux-saga/effects';

import { INVITE_LINKS } from '../actions/actionsTypes';
import { inviteLinksSuccess, inviteLinksFailure } from '../actions/inviteLinks';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import Navigation from '../lib/Navigation';

const handleRequest = function* handleRequest({ token }) {
	try {
		const validateResult = yield RocketChat.validateInviteToken(token);
		if (!validateResult.valid) {
			yield put(inviteLinksFailure());
		}

		const result = yield RocketChat.useInviteToken(token);
		if (!result.success) {
			yield put(inviteLinksFailure());
		}

		if (result.room && result.room.rid) {
			yield Navigation.navigate('RoomsListView');
			const { room } = result;
			Navigation.navigate('RoomView', {
				rid: room.rid,
				name: RocketChat.getRoomTitle(room),
				t: room.t
			});
		}
	} catch (e) {
		yield put(inviteLinksFailure());
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(INVITE_LINKS.REQUEST, handleRequest);
};

export default root;

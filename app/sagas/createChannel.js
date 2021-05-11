import {
	select, put, call, take, takeLatest
} from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { CREATE_CHANNEL, LOGIN } from '../actions/actionsTypes';
import { createChannelSuccess, createChannelFailure } from '../actions/createChannel';
import { showErrorAlert } from '../utils/info';
import RocketChat from '../lib/rocketchat';
import Navigation from '../lib/Navigation';
import database from '../lib/database';
import I18n from '../i18n';
import { logEvent, events } from '../utils/log';
import { goRoom } from '../utils/goRoom';

const createChannel = function createChannel(data) {
	return RocketChat.createChannel(data);
};

const createGroupChat = function createGroupChat() {
	return RocketChat.createGroupChat();
};

const createTeam = function createTeam(data) {
	return RocketChat.createTeam(data);
};

const handleRequest = function* handleRequest({ data }) {
	try {
		const auth = yield select(state => state.login.isAuthenticated);
		if (!auth) {
			yield take(LOGIN.SUCCESS);
		}

		let sub;
		if (data.isTeam) {
			const {
				type,
				readOnly,
				broadcast,
				encrypted
			} = data;
			logEvent(events.CR_CREATE, {
				type,
				readOnly,
				broadcast,
				encrypted
			});
			sub = yield call(createTeam, data);
		} else if (data.group) {
			logEvent(events.SELECTED_USERS_CREATE_GROUP);
			const result = yield call(createGroupChat);
			if (result.success) {
				({ room: sub } = result);
			}
		} else {
			const {
				type,
				readOnly,
				broadcast,
				encrypted
			} = data;
			logEvent(events.CR_CREATE, {
				type: type ? 'private' : 'public',
				readOnly,
				broadcast,
				encrypted
			});
			sub = yield call(createChannel, data);
		}

		try {
			const db = database.active;
			const subCollection = db.get('subscriptions');
			yield db.action(async() => {
				await subCollection.create((s) => {
					s._raw = sanitizedRaw({ id: sub.team ? sub.team.roomId : sub.rid }, subCollection.schema);
					Object.assign(s, sub);
				});
			});
		} catch {
			// do nothing
		}

		let successParams = {};
		if (data.isTeam) {
			successParams = {
				...sub.team,
				rid: sub.team.roomId,
				t: sub.team.type ? 'p' : 'c'
			};
		} else {
			successParams = data;
		}
		yield put(createChannelSuccess(successParams));
	} catch (err) {
		logEvent(events[data.group ? 'SELECTED_USERS_CREATE_GROUP_F' : 'CR_CREATE_F']);
		yield put(createChannelFailure(err));
	}
};

const handleSuccess = function* handleSuccess({ data }) {
	const isMasterDetail = yield select(state => state.app.isMasterDetail);
	if (isMasterDetail) {
		Navigation.navigate('DrawerNavigator');
	}
	goRoom({ item: data, isMasterDetail });
};

const handleFailure = function handleFailure({ err }) {
	setTimeout(() => {
		const msg = err.data ? I18n.t(err.data.error) : err.reason || I18n.t('There_was_an_error_while_action', { action: I18n.t('creating_channel') });
		showErrorAlert(msg);
	}, 300);
};

const root = function* root() {
	yield takeLatest(CREATE_CHANNEL.REQUEST, handleRequest);
	yield takeLatest(CREATE_CHANNEL.SUCCESS, handleSuccess);
	yield takeLatest(CREATE_CHANNEL.FAILURE, handleFailure);
};

export default root;

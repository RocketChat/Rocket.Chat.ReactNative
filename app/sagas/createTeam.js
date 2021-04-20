import {
	select, put, call, take, takeLatest
} from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { CREATE_TEAM, LOGIN } from '../actions/actionsTypes';
import { createTeamSuccess, createTeamFailure } from '../actions/createTeam';
import { showErrorAlert } from '../utils/info';
import RocketChat from '../lib/rocketchat';
import Navigation from '../lib/Navigation';
import database from '../lib/database';
import I18n from '../i18n';
import { logEvent, events } from '../utils/log';
import { goRoom } from '../utils/goRoom';

const createTeam = function createTeam(data) {
	return RocketChat.createTeam(data);
};

const handleRequest = function* handleRequest({ data }) {
	try {
		const auth = yield select(state => state.login.isAuthenticated);
		if (!auth) {
			yield take(LOGIN.SUCCESS);
		}

		const {
			type, readOnly, broadcast, encrypted
		} = data;

		logEvent(events.CR_CREATE, {
			type,
			readOnly,
			broadcast,
			encrypted
		});
		const sub = yield call(createTeam, data);

		try {
			const db = database.active;
			const subCollection = db.get('subscriptions');
			yield db.action(async() => {
				await subCollection.create((s) => {
					s._raw = sanitizedRaw({ id: sub.rid }, subCollection.schema);
					Object.assign(s, sub);
				});
			});
		} catch {
			// do nothing
		}

		yield put(createTeamSuccess(sub));
	} catch (err) {
		logEvent(events[data.group ? 'SELECTED_USERS_CREATE_GROUP_F' : 'CR_CREATE_F']);
		yield put(createTeamFailure(err));
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
		const msg = err.reason || I18n.t('There_was_an_error_while_action', { action: I18n.t('creating_team') });
		showErrorAlert(msg);
	}, 300);
};

const root = function* root() {
	yield takeLatest(CREATE_TEAM.REQUEST, handleRequest);
	yield takeLatest(CREATE_TEAM.SUCCESS, handleSuccess);
	yield takeLatest(CREATE_TEAM.FAILURE, handleFailure);
};

export default root;

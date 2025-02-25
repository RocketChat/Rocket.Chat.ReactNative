import { call, put, select, take, takeLatest } from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { CREATE_CHANNEL, LOGIN } from '../actions/actionsTypes';
import { createChannelFailure, createChannelSuccess } from '../actions/createChannel';
import { showErrorAlert } from '../lib/methods/helpers/info';
import database from '../lib/database';
import I18n from '../i18n';
import { events, logEvent } from '../lib/methods/helpers/log';
import { goRoom } from '../lib/methods/helpers/goRoom';
import { Services } from '../lib/services';
import { Encryption } from '../lib/encryption';

const handleRequest = function* handleRequest({ data }) {
	try {
		const auth = yield select(state => state.login.isAuthenticated);
		if (!auth) {
			yield take(LOGIN.SUCCESS);
		}

		let sub;
		if (data.isTeam) {
			const { type, readOnly, broadcast, encrypted } = data;
			logEvent(events.CT_CREATE, {
				type: `${type}`,
				readOnly: `${readOnly}`,
				broadcast: `${broadcast}`,
				encrypted: `${encrypted}`
			});
			const result = yield Services.createTeam(data);
			sub = {
				rid: result?.team?.roomId,
				...result.team,
				t: result.team.type ? 'p' : 'c'
			};
		} else if (data.group) {
			logEvent(events.SELECTED_USERS_CREATE_GROUP);
			const result = yield Services.createGroupChat();
			if (result.success) {
				sub = {
					rid: result.room?._id,
					...result.room
				};
			}
		} else {
			const { type, readOnly, broadcast, encrypted } = data;
			logEvent(events.CR_CREATE, {
				type: type ? 'private' : 'public',
				readOnly,
				broadcast,
				encrypted
			});
			const result = yield Services.createChannel(data);
			sub = {
				rid: result?.channel?._id || result?.group?._id,
				...result?.channel,
				...result?.group
			};
		}
		try {
			const db = database.active;
			const subCollection = db.get('subscriptions');
			yield db.write(async () => {
				await subCollection.create(s => {
					s._raw = sanitizedRaw({ id: sub.rid }, subCollection.schema);
					Object.assign(s, sub);
				});
			});

			if (data.encrypted) {
				Encryption.encryptSubscription(sub.rid);
			}
		} catch {
			// do nothing
		}
		yield put(createChannelSuccess(sub));
	} catch (err) {
		logEvent(events[data.group ? 'SELECTED_USERS_CREATE_GROUP_F' : 'CR_CREATE_F']);
		yield put(createChannelFailure(err, data.isTeam));
	}
};

const handleSuccess = function* handleSuccess({ data }) {
	const isMasterDetail = yield select(state => state.app.isMasterDetail);
	goRoom({ item: data, isMasterDetail, popToRoot: true });
};

const handleFailure = function handleFailure({ err, isTeam }) {
	const errorArray = [
		'room-name-already-exists',
		'error-team-creation',
		'unauthorized',
		'error-duplicate-channel-name',
		'error-invalid-room-name',
		'team-name-already-exists'
	];

	setTimeout(() => {
		let msg = '';
		const actionError = I18n.t('There_was_an_error_while_action', {
			action: isTeam ? I18n.t('creating_team') : I18n.t('creating_channel')
		});
		if (err?.data?.errorType && err?.data?.details?.channel_name) {
			msg = errorArray.includes(err.data.errorType)
				? I18n.t(err.data.errorType, { room_name: err.data.details.channel_name })
				: actionError;
		} else {
			msg = err?.reason || (errorArray.includes(err?.data?.error) ? I18n.t(err.data.error) : err?.data?.error || actionError);
		}
		showErrorAlert(msg, isTeam ? I18n.t('Create_Team') : I18n.t('Create_Channel'));
	}, 300);
};

const root = function* root() {
	yield takeLatest(CREATE_CHANNEL.REQUEST, handleRequest);
	yield takeLatest(CREATE_CHANNEL.SUCCESS, handleSuccess);
	yield takeLatest(CREATE_CHANNEL.FAILURE, handleFailure);
};

export default root;

import {
	select, put, call, take, takeLatest
} from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { CREATE_CHANNEL, LOGIN } from '../actions/actionsTypes';
import { createChannelSuccess, createChannelFailure } from '../actions/createChannel';
import RocketChat from '../lib/rocketchat';
import database from '../lib/database';

const create = function* create(data) {
	return yield RocketChat.createChannel(data);
};

const handleRequest = function* handleRequest({ data }) {
	try {
		const auth = yield select(state => state.login.isAuthenticated);
		if (!auth) {
			yield take(LOGIN.SUCCESS);
		}
		const sub = yield call(create, data);

		try {
			const db = database.active;
			const subCollection = db.collections.get('subscriptions');
			yield db.action(async() => {
				await subCollection.create((s) => {
					s._raw = sanitizedRaw({ id: sub.rid }, subCollection.schema);
					Object.assign(s, sub);
				});
			});
		} catch {
			// do nothing
		}

		yield put(createChannelSuccess(sub));
	} catch (err) {
		yield put(createChannelFailure(err));
	}
};

const root = function* root() {
	yield takeLatest(CREATE_CHANNEL.REQUEST, handleRequest);
};

export default root;

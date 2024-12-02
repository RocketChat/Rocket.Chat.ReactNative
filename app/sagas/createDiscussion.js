import { call, put, select, take, takeLatest } from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { CREATE_DISCUSSION, LOGIN } from '../actions/actionsTypes';
import { createDiscussionFailure, createDiscussionSuccess } from '../actions/createDiscussion';
import database from '../lib/database';
import { events, logEvent } from '../lib/methods/helpers/log';
import { Services } from '../lib/services';

const handleRequest = function* handleRequest({ data }) {
	logEvent(events.CD_CREATE);
	try {
		const auth = yield select(state => state.login.isAuthenticated);
		if (!auth) {
			yield take(LOGIN.SUCCESS);
		}
		const result = yield Services.createDiscussion(data);

		if (result.success) {
			const { discussion: sub } = result;

			try {
				const db = database.active;
				const subCollection = db.get('subscriptions');
				yield db.write(async () => {
					await subCollection.create(s => {
						s._raw = sanitizedRaw({ id: sub.rid }, subCollection.schema);
						Object.assign(s, sub);
					});
				});
			} catch {
				// do nothing
			}
			yield put(createDiscussionSuccess(sub));
		} else {
			logEvent(events.CD_CREATE_F);
			yield put(createDiscussionFailure(result));
		}
	} catch (err) {
		logEvent(events.CD_CREATE_F);
		yield put(createDiscussionFailure(err));
	}
};

const root = function* root() {
	yield takeLatest(CREATE_DISCUSSION.REQUEST, handleRequest);
};

export default root;

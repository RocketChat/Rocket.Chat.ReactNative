import { put, takeLatest } from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import { inquirySuccess, inquiryFailure } from '../actions/inquiry';

const handleRequest = function* handleRequest() {
	try {
		const result = yield RocketChat.getInquiriesQueued();
		if (result.success) {
			const { inquiries } = result;

			// subscribe to inquiry queue changes
			RocketChat.subscribeInquiry();

			// put request result on redux state
			yield put(inquirySuccess(inquiries));
		}
	} catch (e) {
		yield put(inquiryFailure(e));
	}
};

// This action remove the inquiry queued room from the redux store on reducers
const handleTake = function* handleTake({ inquiryId }) {
	try {
		const data = yield RocketChat.takeInquiry(inquiryId);
		if (data.success) {
			const { inquiry } = data;
			try {
				const db = database.active;
				const subCollection = db.collections.get('subscriptions');

				// create a subscription with the inquiry data, it's also done by subscriptions stream
				yield db.action(async() => {
					await subCollection.create((s) => {
						s._raw = sanitizedRaw({ id: inquiry._id }, subCollection.schema);
						s.visitor = inquiry.v;
						delete inquiry.v;
						Object.assign(s, inquiry);
					});
				});
			} catch {
				// do nothing
			}
		}
	} catch {
		// Do nothing
	}
};

const root = function* root() {
	yield takeLatest(types.INQUIRY.REQUEST, handleRequest);
	yield takeLatest(types.INQUIRY.TAKE, handleTake);
};
export default root;

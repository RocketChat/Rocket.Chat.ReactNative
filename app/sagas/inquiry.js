import { put, takeLatest, select } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { inquirySuccess, inquiryFailure, inquirySetEnabled } from '../actions/inquiry';

const handleRequest = function* handleRequest() {
	try {
		const routingConfig = yield RocketChat.getRoutingConfig();
		const statusLivechat = yield select(state => state.login.user.statusLivechat);
		const showQueue = routingConfig.showQueue && statusLivechat === 'available';

		if (showQueue) {
			const result = yield RocketChat.getInquiriesQueued();
			if (result.success) {
				const { inquiries } = result;

				// subscribe to inquiry queue changes
				RocketChat.subscribeInquiry();

				// put request result on redux state
				yield put(inquirySuccess(inquiries));
			}
		}

		yield put(inquirySetEnabled(showQueue));
	} catch (e) {
		yield put(inquiryFailure(e));
	}
};

// This action remove the inquiry queued room from the redux store on reducers
const handleTake = function* handleTake({ inquiryId }) {
	try {
		// We don't need to use the return since it's added by subscriptions stream
		yield RocketChat.takeInquiry(inquiryId);
	} catch {
		// Do nothing
	}
};

const root = function* root() {
	yield takeLatest(types.INQUIRY.REQUEST, handleRequest);
	yield takeLatest(types.INQUIRY.TAKE, handleTake);
};
export default root;

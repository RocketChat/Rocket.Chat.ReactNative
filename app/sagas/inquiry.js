import { put, takeLatest, select } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { inquirySuccess, inquiryFailure, inquirySetEnabled } from '../actions/inquiry';

const handleRequest = function* handleRequest() {
	try {
		const routingConfig = yield RocketChat.getRoutingConfig();
		const statusLivechat = yield select(state => state.login.user.statusLivechat);
		// if routingConfig showQueue is enabled and omnichannel is enabled
		const showQueue = routingConfig.showQueue && statusLivechat === 'available';

		if (showQueue) {
			// get all the current chats on the queue
			const result = yield RocketChat.getInquiriesQueued();
			if (result.success) {
				const { inquiries } = result;

				// subscribe to inquiry queue changes
				RocketChat.subscribeInquiry();

				// put request result on redux state
				yield put(inquirySuccess(inquiries));
			}
		}

		// set enabled to know if we should show the queue button
		yield put(inquirySetEnabled(showQueue));
	} catch (e) {
		yield put(inquiryFailure(e));
	}
};

const root = function* root() {
	yield takeLatest(types.INQUIRY.REQUEST, handleRequest);
};
export default root;

import { put, select, takeLatest } from 'redux-saga/effects';

import * as types from '../../../actions/actionsTypes';
import { Services } from '../../../lib/services';
import EventEmitter from '../../../lib/methods/helpers/events';
import { inquiryFailure, inquirySetEnabled, inquirySuccess } from '../actions/inquiry';
import { getInquiriesQueued, isOmnichannelStatusAvailable } from '../lib';

const handleRequest = function* handleRequest() {
	try {
		const routingConfig = yield Services.getRoutingConfig();
		const user = yield select(state => state.login.user);
		// if routingConfig showQueue is enabled and omnichannel is enabled
		const showQueue = routingConfig.showQueue && isOmnichannelStatusAvailable(user);

		if (showQueue) {
			const serverVersion = yield select(state => state.server.version);

			// get all the current chats on the queue
			const result = yield getInquiriesQueued(serverVersion);
			if (result.success) {
				const { inquiries } = result;

				// subscribe to inquiry queue changes
				EventEmitter.emit('INQUIRY_SUBSCRIBE');

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

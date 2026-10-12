import { put, select, takeEvery, takeLatest } from 'redux-saga/effects';

import * as types from '~/actions/actionsTypes';
import { getRoutingConfig } from '~/lib/services/restApi';
import { isOmnichannelModuleAvailable } from '~/lib/methods/enterpriseModules';
import EventEmitter from '~/lib/methods/helpers/events';
import { inquiryFailure, inquiryRequest, inquiryReset, inquirySetEnabled, inquirySuccess } from '../actions/inquiry';
import { getInquiriesQueued, isOmnichannelStatusAvailable } from '../lib';

const handleRequest = function* handleRequest() {
	try {
		const routingConfig = yield getRoutingConfig();
		const user = yield select(state => state.login.user);
		// if routingConfig showQueue is enabled and omnichannel is enabled
		const showQueue = routingConfig.showQueue && isOmnichannelStatusAvailable(user.statusLivechat);

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

const isLivechatEnabledUpdate = action => action.type === types.SETTINGS.UPDATE && action.payload.id === 'Livechat_enabled';

const handleLivechatEnabledUpdate = function* handleLivechatEnabledUpdate({ payload }) {
	if (payload.value === false) {
		EventEmitter.emit('INQUIRY_UNSUBSCRIBE');
		yield put(inquiryReset());
		return;
	}

	const statusLivechat = yield select(state => state.login.user.statusLivechat);
	if (isOmnichannelStatusAvailable(statusLivechat) && isOmnichannelModuleAvailable()) {
		yield put(inquiryRequest());
	}
};

const root = function* root() {
	yield takeLatest(types.INQUIRY.REQUEST, handleRequest);
	yield takeEvery(isLivechatEnabledUpdate, handleLivechatEnabledUpdate);
};
export default root;

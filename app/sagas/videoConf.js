import { takeLatest } from 'redux-saga/effects';

import { VIDEO_CONF } from '../actions/actionsTypes';

const handleVideoConfIncomingWebsocketMessages = function* handleVideoConfIncomingWebsocketMessages({ data }) {
	const { action, params } = data.action;

	if (!action || typeof action !== 'string') {
		return;
	}
	if (!params || typeof params !== 'object' || !params.callId || !params.uid || !params.rid) {
		return;
	}

	console.log(action, params);
	// switch (action) {
	// 	case 'call':
	// 		return this.onDirectCall(params);
	// 	case 'canceled':
	// 		return this.onDirectCallCanceled(params);
	// 	case 'accepted':
	// 		return this.onDirectCallAccepted(params);
	// 	case 'rejected':
	// 		return this.onDirectCallRejected(params);
	// 	case 'confirmed':
	// 		return this.onDirectCallConfirmed(params);
	// 	case 'join':
	// 		return this.onDirectCallJoined(params);
	// 	case 'end':
	// 		return this.onDirectCallEnded(params);
	// }
};

const root = function* root() {
	yield takeLatest(VIDEO_CONF.HANDLE_INCOMING_WEBSOCKET_MESSAGES, handleVideoConfIncomingWebsocketMessages);
};

export default root;

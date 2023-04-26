import { Action } from 'redux';
import { delay, put, takeEvery } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';

import { VIDEO_CONF } from '../actions/actionsTypes';
import { removeVideoConfCall, setCalling, setVideoConfCall, TCallProps } from '../actions/videoConf';
import { actionSheetRef } from '../containers/ActionSheet';
import IncomingCallComponent from '../containers/InAppNotification/IncomingCallComponent';
import i18n from '../i18n';
import { getSubscriptionByRoomId } from '../lib/database/services/Subscription';
import { appSelector } from '../lib/hooks';
import { callJitsi } from '../lib/methods';
import { compareServerVersion, showErrorAlert } from '../lib/methods/helpers';
import log from '../lib/methods/helpers/log';
import { hideCustomNotification, showCustomNotification } from '../lib/methods/helpers/notifications';
import { showToast } from '../lib/methods/helpers/showToast';
import { videoConfJoin } from '../lib/methods/videoConf';
import { Services } from '../lib/services';
import { notifyUser } from '../lib/services/restApi';
import { ICallInfo } from '../reducers/videoConf';

// The interval between attempts to call the remote user
const CALL_INTERVAL = 3000;
// How many attempts to call we're gonna make
const CALL_ATTEMPT_LIMIT = 10;
interface IGenericAction extends Action {
	type: string;
}

function* onDirectCall(payload: ICallInfo) {
	const calls = yield* appSelector(state => state.videoConf.calls);
	const currentCall = calls.filter(c => c.callId === payload.callId);
	const hasAnotherCall = calls.filter(c => c.action === 'call');
	if (hasAnotherCall.length && hasAnotherCall[0].callId !== payload.callId) {
		return;
	}
	if (!currentCall.length) {
		yield put(setVideoConfCall({ ...payload, action: 'call' }));
		showCustomNotification(IncomingCallComponent, payload, 30000);
	}
}

function* onDirectCallCanceled(payload: ICallInfo) {
	const calls = yield* appSelector(state => state.videoConf.calls);
	const currentCall = calls.filter(c => c.callId === payload.callId);
	if (currentCall.length) {
		yield put(removeVideoConfCall(currentCall[0]));
		hideCustomNotification();
	}
}

function* onDirectCallAccepted(payload: ICallInfo) {
	const calls = yield* appSelector(state => state.videoConf.calls);
	const currentCall = calls.filter(c => c.callId === payload.callId);
	if (currentCall.length) {
		yield put(removeVideoConfCall(currentCall[0]));
		yield call(actionSheetRef?.current?.hideActionSheet);
		videoConfJoin(payload.callId, false, true);
	}
}

function* onDirectCallRejected(payload: ICallInfo) {
	yield call(cancelCall, {});
	showToast(i18n.t('Call_rejected'));
	yield call(actionSheetRef?.current?.hideActionSheet);
}

function* onDirectCallConfirmed(payload: ICallInfo) {
	return null;
}

function* onDirectCallJoined(payload: ICallInfo) {
	return null;
}

function* onDirectCallEnded(payload: ICallInfo) {
	const calls = yield* appSelector(state => state.videoConf.calls);
	const currentCall = calls.filter(c => c.callId === payload.callId);
	if (currentCall.length) {
		yield put(removeVideoConfCall(currentCall[0]));
		hideCustomNotification();
	}
}

function* handleVideoConfIncomingWebsocketMessages({ data }: { data: any }) {
	const { action, params } = data.action;

	if (!action || typeof action !== 'string') {
		return;
	}
	if (!params || typeof params !== 'object' || !params.callId || !params.uid || !params.rid) {
		return;
	}
	const prop = { ...params, action };
	switch (action) {
		case 'call':
			yield call(onDirectCall, prop);
			break;
		case 'canceled':
			yield call(onDirectCallCanceled, prop);
			break;
		case 'accepted':
			yield call(onDirectCallAccepted, prop);
			break;
		case 'rejected':
			yield call(onDirectCallRejected, prop);
			break;
		case 'confirmed':
			yield call(onDirectCallConfirmed, prop);
			break;
		case 'join':
			yield call(onDirectCallJoined, prop);
			break;
		case 'end':
			yield call(onDirectCallEnded, prop);
			break;
	}
}

function* initCall({ payload: { mic, cam, direct, rid } }: { payload: TCallProps }) {
	yield put(setCalling(true));
	const serverVersion = yield* appSelector(state => state.server.version);
	const isServer5OrNewer = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0');
	if (isServer5OrNewer) {
		try {
			const videoConfResponse = yield* call(Services.videoConferenceStart, rid);
			if (videoConfResponse.success) {
				if (direct && videoConfResponse.data.type === 'direct') {
					yield call(callUser, { rid, uid: videoConfResponse.data.calleeId, callId: videoConfResponse.data.callId });
				} else {
					videoConfJoin(videoConfResponse.data.callId, cam, mic);
					yield call(actionSheetRef?.current?.hideActionSheet);
					yield put(setCalling(false));
				}
			}
		} catch (e) {
			yield put(setCalling(false));
			showErrorAlert(i18n.t('error-init-video-conf'));
			log(e);
		}
	} else {
		const sub = yield* call(getSubscriptionByRoomId, rid);
		if (sub) {
			callJitsi({ room: sub, cam });
			yield put(setCalling(false));
		}
	}
}

function* giveUp({ rid, uid, callId, rejected }: { rid: string; uid: string; callId: string; rejected?: boolean }) {
	yield put(removeVideoConfCall({ rid, uid, callId }));
	if (!rejected) {
		yield put(setCalling(false));
	}
	notifyUser(`${uid}/video-conference`, { action: rejected ? 'rejected' : 'canceled', params: { uid, rid, callId } });
	yield call(Services.videoConferenceCancel, callId);
}

function* cancelCall({ payload }: { payload?: { callId?: string } }) {
	const calls = yield* appSelector(state => state.videoConf.calls);
	if (payload?.callId) {
		const currentCall = calls.filter(c => c.callId === payload.callId);
		if (currentCall.length) {
			yield call(giveUp, { ...currentCall[0], rejected: true });
		}
	} else {
		const currentCall = calls.filter(c => c.action === 'calling');
		if (currentCall.length && currentCall[0].callId) {
			yield call(giveUp, currentCall[0]);
		}
	}
}

function* callUser({ rid, uid, callId }: { rid: string; uid: string; callId: string }) {
	const userId = yield* appSelector(state => state.login.user.id);
	yield put(setVideoConfCall({ rid, uid, callId, action: 'calling' }));
	for (let attempt = 1; attempt <= CALL_ATTEMPT_LIMIT; attempt++) {
		if (attempt < CALL_ATTEMPT_LIMIT) {
			const calls = yield* appSelector(state => state.videoConf.calls);
			const currentCall = calls.filter(c => c.callId === callId);
			if (!currentCall.length || currentCall[0].action !== 'calling') {
				break;
			}
			yield call(notifyUser, `${uid}/video-conference`, { action: 'call', params: { uid: userId, rid, callId } });
			yield delay(CALL_INTERVAL);
		} else {
			actionSheetRef?.current?.hideActionSheet();
			yield call(giveUp, { uid, rid, callId });
			break;
		}
	}
}

export default function* root(): Generator {
	yield takeEvery<
		IGenericAction & {
			data: any;
		}
	>(VIDEO_CONF.HANDLE_INCOMING_WEBSOCKET_MESSAGES, handleVideoConfIncomingWebsocketMessages);
	yield takeEvery<IGenericAction & { payload: TCallProps }>(VIDEO_CONF.INIT_CALL, initCall);
	yield takeEvery<
		IGenericAction & {
			payload?: { callId?: string };
		}
	>(VIDEO_CONF.CANCEL_CALL, cancelCall);
}

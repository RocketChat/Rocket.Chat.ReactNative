import { Action } from 'redux';
import { delay, put, takeEvery } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';

import { VIDEO_CONF } from '../actions/actionsTypes';
import { removeVideoConfCall, setCalling, setVideoConfCall, TCallProps } from '../actions/videoConf';
import { hideActionSheetRef } from '../containers/ActionSheet';
import { INAPP_NOTIFICATION_EMITTER } from '../containers/InAppNotification';
import IncomingCallNotification from '../containers/InAppNotification/IncomingCallNotification';
import i18n from '../i18n';
import { getSubscriptionByRoomId } from '../lib/database/services/Subscription';
import { appSelector } from '../lib/hooks';
import { callJitsi } from '../lib/methods';
import { compareServerVersion, showErrorAlert } from '../lib/methods/helpers';
import EventEmitter from '../lib/methods/helpers/events';
import log from '../lib/methods/helpers/log';
import { hideNotification } from '../lib/methods/helpers/notifications';
import { showToast } from '../lib/methods/helpers/showToast';
import { videoConfJoin } from '../lib/methods/videoConf';
import { Services } from '../lib/services';
import { notifyUser } from '../lib/services/restApi';
import { ICallInfo } from '../reducers/videoConf';

interface IGenericAction extends Action {
	type: string;
}

type THandleGeneric = IGenericAction & {
	data: any;
};

type TInitCallGeneric = IGenericAction & {
	payload: TCallProps;
};

type TCancelCallGeneric = IGenericAction & {
	payload?: { callId?: string };
};

type TAcceptCallGeneric = IGenericAction & {
	payload: { callId: string };
};

// The interval between attempts to call the remote user
const CALL_INTERVAL = 3000;
// How many attempts to call we're gonna make
const CALL_ATTEMPT_LIMIT = 10;

function* onDirectCall(payload: ICallInfo) {
	const calls = yield* appSelector(state => state.videoConf.calls);
	const currentCall = calls.find(c => c.callId === payload.callId);
	const hasAnotherCall = calls.find(c => c.action === 'call');
	if (hasAnotherCall && hasAnotherCall.callId !== payload.callId) return;
	const foreground = yield* appSelector(state => state.app.foreground);
	if (!currentCall && foreground) {
		yield put(setVideoConfCall(payload));
		EventEmitter.emit(INAPP_NOTIFICATION_EMITTER, {
			// @ts-ignore - Component props do not match Event emitter props
			customComponent: IncomingCallNotification,
			customTime: 30000,
			customNotification: true,
			hideOnPress: false,
			swipeEnabled: false,
			...payload
		});
	}
}

function* onDirectCallCanceled(payload: ICallInfo) {
	const calls = yield* appSelector(state => state.videoConf.calls);
	const currentCall = calls.find(c => c.callId === payload.callId);
	if (currentCall) {
		yield put(removeVideoConfCall(currentCall));
		hideNotification();
	}
}

function* onDirectCallAccepted({ callId, rid, uid, action }: ICallInfo) {
	try {
		const calls = yield* appSelector(state => state.videoConf.calls);
		const userId = yield* appSelector(state => state.login.user.id);
		const currentCall = calls.find(c => c.callId === callId);
		if (currentCall && currentCall.action === 'calling') {
			yield call(notifyUser, `${uid}/video-conference`, { action: 'confirmed', params: { uid: userId, rid, callId } });
			yield put(setVideoConfCall({ callId, rid, uid, action }));
		}
	} catch {
		// do nothing
	}
}

function* onDirectCallRejected() {
	yield call(cancelCall, {});
	showToast(i18n.t('Call_rejected'));
	yield call(hideActionSheetRef);
}

function* onDirectCallConfirmed(payload: ICallInfo) {
	const calls = yield* appSelector(state => state.videoConf.calls);
	const currentCall = calls.find(c => c.callId === payload.callId);
	if (currentCall) {
		yield put(removeVideoConfCall(currentCall));
		yield call(hideActionSheetRef);
		videoConfJoin(payload.callId, false, true);
	}
}

function* onDirectCallJoined(payload: ICallInfo) {
	const calls = yield* appSelector(state => state.videoConf.calls);
	const currentCall = calls.find(c => c.callId === payload.callId);
	if (currentCall && (currentCall.action === 'accepted' || currentCall.action === 'calling')) {
		yield put(setCalling(false));
		yield put(removeVideoConfCall(currentCall));
		yield call(hideActionSheetRef);
		videoConfJoin(payload.callId, false, true);
	}
}

function* onDirectCallEnded(payload: ICallInfo) {
	const calls = yield* appSelector(state => state.videoConf.calls);
	const currentCall = calls.find(c => c.callId === payload.callId);
	if (currentCall) {
		yield put(removeVideoConfCall(currentCall));
		hideNotification();
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
					yield call(hideActionSheetRef);
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
	yield call(notifyUser, `${uid}/video-conference`, { action: rejected ? 'rejected' : 'canceled', params: { uid, rid, callId } });
	if (!rejected) {
		yield put(setCalling(false));
		yield call(Services.videoConferenceCancel, callId);
	}
}

function* cancelCall({ payload }: { payload?: { callId?: string } }) {
	try {
		const calls = yield* appSelector(state => state.videoConf.calls);
		if (payload?.callId) {
			const currentCall = calls.find(c => c.callId === payload.callId);
			if (currentCall) {
				yield call(giveUp, { ...currentCall, rejected: true });
			}
		} else {
			const currentCall = calls.find(c => c.action === 'calling');
			if (currentCall && currentCall.callId) {
				yield call(giveUp, currentCall);
			}
		}
	} catch {
		// do nothing
	}
}

function* callUser({ rid, uid, callId }: { rid: string; uid: string; callId: string }) {
	try {
		const userId = yield* appSelector(state => state.login.user.id);
		yield put(setVideoConfCall({ rid, uid, callId, action: 'calling' }));
		for (let attempt = 1; attempt <= CALL_ATTEMPT_LIMIT; attempt++) {
			if (attempt < CALL_ATTEMPT_LIMIT) {
				const calls = yield* appSelector(state => state.videoConf.calls);
				const currentCall = calls.find(c => c.callId === callId);
				if (!currentCall || currentCall.action !== 'calling') {
					break;
				}
				yield call(notifyUser, `${uid}/video-conference`, { action: 'call', params: { uid: userId, rid, callId } });
				yield delay(CALL_INTERVAL);
			} else {
				hideActionSheetRef();
				yield call(giveUp, { uid, rid, callId });
				break;
			}
		}
	} catch {
		// do nothing
	}
}

function* acceptCall({ payload: { callId } }: { payload: { callId: string } }) {
	try {
		const calls = yield* appSelector(state => state.videoConf.calls);
		const currentCall = calls.find(c => c.callId === callId);
		if (currentCall && currentCall.action === 'call') {
			const userId = yield* appSelector(state => state.login.user.id);
			yield call(notifyUser, `${currentCall.uid}/video-conference`, {
				action: 'accepted',
				params: { uid: userId, rid: currentCall.rid, callId: currentCall.callId }
			});
			yield put(setVideoConfCall({ ...currentCall, action: 'accepted' }));
			hideNotification();
		}
	} catch {
		// do nothing
	}
}

export default function* root(): Generator {
	yield takeEvery<THandleGeneric>(VIDEO_CONF.HANDLE_INCOMING_WEBSOCKET_MESSAGES, handleVideoConfIncomingWebsocketMessages);
	yield takeEvery<TInitCallGeneric>(VIDEO_CONF.INIT_CALL, initCall);
	yield takeEvery<TCancelCallGeneric>(VIDEO_CONF.CANCEL_CALL, cancelCall);
	yield takeEvery<TAcceptCallGeneric>(VIDEO_CONF.ACCEPT_CALL, acceptCall);
}

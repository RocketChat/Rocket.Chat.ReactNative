import { Action } from 'redux';
import { call, takeLatest } from 'typed-redux-saga';

import { VIDEO_CONF } from '../actions/actionsTypes';
import { IVideoConfGenericAction, TCallProps } from '../actions/videoConf';
import i18n from '../i18n';
import { getSubscriptionByRoomId } from '../lib/database/services/Subscription';
import { appSelector } from '../lib/hooks';
import { callJitsi } from '../lib/methods';
import { compareServerVersion, showErrorAlert } from '../lib/methods/helpers';
import log from '../lib/methods/helpers/log';
import { videoConfJoin } from '../lib/methods/videoConf';
import { Services } from '../lib/services';
import { ICallInfo } from '../reducers/videoConf';

type TGenerator = Generator<IVideoConfGenericAction>;

function* onDirectCall(payload: ICallInfo): TGenerator {
	return null;
}

function* onDirectCallCanceled(payload: ICallInfo): TGenerator {
	return null;
}

function* onDirectCallAccepted(payload: ICallInfo): TGenerator {
	return null;
}

function* onDirectCallRejected(payload: ICallInfo): TGenerator {
	return null;
}

function* onDirectCallConfirmed(payload: ICallInfo): TGenerator {
	return null;
}

function* onDirectCallJoined(payload: ICallInfo): TGenerator {
	return null;
}

function* onDirectCallEnded(payload: ICallInfo): TGenerator {
	return null;
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

function* initCall({ payload: { mic, cam, direct, roomId } }: { payload: TCallProps }) {
	const serverVersion = yield* appSelector(state => state.server.version);
	const isServer5OrNewer = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0');
	if (isServer5OrNewer) {
		try {
			const videoConfResponse = yield* call(Services.videoConferenceStart, roomId);
			if (videoConfResponse.success) {
				if (direct) {
					// callUser({ uid: data.calleeId, rid: roomId, callId: data.callId });
				} else {
					videoConfJoin(videoConfResponse.data.callId, cam, mic);
				}
				// setCalling(false);
			}
		} catch (e) {
			// setCalling(false);
			showErrorAlert(i18n.t('error-init-video-conf'));
			log(e);
		}
	} else {
		const sub = yield* call(getSubscriptionByRoomId, roomId);
		if (sub) {
			callJitsi({ room: sub, cam });
			// setCalling(false);
		}
	}
}

interface IGenericAction extends Action {
	type: string;
}

export default function* root(): Generator {
	yield takeLatest<
	IGenericAction & {
		data: any;
	}
	>(VIDEO_CONF.HANDLE_INCOMING_WEBSOCKET_MESSAGES, handleVideoConfIncomingWebsocketMessages);
	yield takeLatest<IGenericAction & { payload: TCallProps }>(VIDEO_CONF.INIT_CALL, initCall);
}

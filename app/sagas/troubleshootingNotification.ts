import { Action } from 'redux';
import { put, takeEvery } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';
import notifee from '@notifee/react-native';

import { TROUBLESHOOTING_NOTIFICATION } from '../actions/actionsTypes';
import { setTroubleshootingNotification } from '../actions/troubleshootingNotification';
import { pushInfo } from '../lib/services/restApi';
import log from '../lib/methods/helpers/log';

interface IGenericAction extends Action {
	type: string;
}

function* request() {
	let deviceNotificationEnabled = false;
	let defaultPushGateway = false;
	let pushGatewayEnabled = false;
	try {
		const { authorizationStatus } = yield* call(notifee.getNotificationSettings);
		deviceNotificationEnabled = authorizationStatus > 0;
		const pushInfoResult = yield* call(pushInfo);
		if (pushInfoResult.success) {
			pushGatewayEnabled = pushInfoResult.pushGatewayEnabled;
			defaultPushGateway = pushInfoResult.defaultPushGateway;
		}
	} catch (e) {
		log(e);
	} finally {
		// If Any of the items that can have red values: notification settings, CE quota, or gateway connection; the red icon should show.
		// Then inAlertNotification has to be true
		const inAlertNotification = !deviceNotificationEnabled || !pushGatewayEnabled;
		yield put(
			setTroubleshootingNotification({ deviceNotificationEnabled, defaultPushGateway, pushGatewayEnabled, inAlertNotification })
		);
	}
}

export default function* root(): Generator {
	yield takeEvery<IGenericAction>(TROUBLESHOOTING_NOTIFICATION.REQUEST, request);
}

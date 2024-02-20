import { Action } from 'redux';
import { call, takeLatest, put } from 'typed-redux-saga';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

import { TROUBLESHOOTING_NOTIFICATION } from '../actions/actionsTypes';
import { setTroubleshootingNotification } from '../actions/troubleshootingNotification';
import { pushInfo } from '../lib/services/restApi';
import log from '../lib/methods/helpers/log';
import { appSelector } from '../lib/hooks';
import { compareServerVersion } from '../lib/methods/helpers';

interface IGenericAction extends Action {
	type: string;
}

function* init() {
	const serverVersion = yield* appSelector(state => state.server.version);
	let deviceNotificationEnabled = false;
	let defaultPushGateway = false;
	let pushGatewayEnabled = false;
	try {
		const { authorizationStatus } = yield* call(notifee.getNotificationSettings);
		deviceNotificationEnabled = authorizationStatus > AuthorizationStatus.DENIED;
	} catch (e) {
		log(e);
	}

	try {
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.5.0')) {
			const pushInfoResult = yield* call(pushInfo);
			if (pushInfoResult.success) {
				pushGatewayEnabled = pushInfoResult.pushGatewayEnabled;
				defaultPushGateway = pushInfoResult.defaultPushGateway;
			}
		}
	} catch (e) {
		log(e);
	}

	const issuesWithNotifications =
		!deviceNotificationEnabled || (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.6.0') && !pushGatewayEnabled);
	yield put(
		setTroubleshootingNotification({
			deviceNotificationEnabled,
			defaultPushGateway,
			pushGatewayEnabled,
			issuesWithNotifications
		})
	);
}

export default function* root(): Generator {
	yield takeLatest<IGenericAction>(TROUBLESHOOTING_NOTIFICATION.INIT, init);
}

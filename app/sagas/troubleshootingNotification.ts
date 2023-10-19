import { Action } from 'redux';
import { put, takeEvery } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';
import notifee from '@notifee/react-native';

import { ITroubleshootingNotification } from '../reducers/troubleshootingNotification';
import { TROUBLESHOOTING_NOTIFICATION } from '../actions/actionsTypes';
import { setInAlertTroubleshootingNotification, setTroubleshootingNotification } from '../actions/troubleshootingNotification';
import { appSelector } from '../lib/hooks';

interface IGenericAction extends Action {
	type: string;
}

type TSetGeneric = IGenericAction & {
	payload: ITroubleshootingNotification;
};

function* request() {
	const settings = yield* call(notifee.getNotificationSettings);
	yield put(setTroubleshootingNotification({ deviceNotificationEnabled: !!settings.authorizationStatus }));
}

function* setNotification({ payload }: { payload: ITroubleshootingNotification }) {
	const troubleshootingNotifcation = yield* appSelector(state => state.troubleshootingNotifcation);
	const newState = { ...troubleshootingNotifcation, ...payload };

	const inAlert = !newState.deviceNotificationEnabled;
	yield put(setInAlertTroubleshootingNotification({ inAlert }));
}

export default function* root(): Generator {
	yield takeEvery<IGenericAction>(TROUBLESHOOTING_NOTIFICATION.REQUEST, request);
	yield takeEvery<TSetGeneric>(TROUBLESHOOTING_NOTIFICATION.SET, setNotification);
}

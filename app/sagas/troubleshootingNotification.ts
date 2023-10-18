import { Action } from 'redux';
import { put, takeEvery } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';
import notifee from '@notifee/react-native';

import { ITroubleshootingNotification } from '../reducers/troubleshootingNotification';
import { TROUBLESHOOTING_NOTIFICATION } from '../actions/actionsTypes';
import { setTroubleshootingNotification } from '../actions/troubleshootingNotification';

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
	console.log('🚀 ~ file: troubleshootingNotification.ts:20 ~ function*setNotification ~ payload:', payload);
}

export default function* root(): Generator {
	yield takeEvery<IGenericAction>(TROUBLESHOOTING_NOTIFICATION.REQUEST, request);
	yield takeEvery<TSetGeneric>(TROUBLESHOOTING_NOTIFICATION.SET, setNotification);
}

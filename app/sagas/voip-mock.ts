import { put, takeEvery, delay } from 'redux-saga/effects';
import RNCallKeep from 'react-native-callkeep';
import { PermissionsAndroid } from 'react-native';

import { VOIP } from '../actions/actionsTypes';
import { clientError, updateRegisterStatus } from '../actions/voip';

function* initCallKeep() {
	try {
		const options = {
			ios: {
				appName: 'Rocket.Chat',
				includesCallsInRecents: false
			},
			android: {
				alertTitle: 'Permissions required',
				alertDescription: 'This application needs to access your phone accounts',
				cancelButton: 'Cancel',
				okButton: 'Ok',
				imageName: 'phone_account_icon',
				additionalPermissions: [
					PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
					PermissionsAndroid.PERMISSIONS.CALL_PHONE,
					PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
				],
				// Required to get audio in background when using Android 11
				foregroundService: {
					channelId: 'chat.rocket',
					channelName: 'Foreground service for my app',
					notificationTitle: 'My app is running on background',
					notificationIcon: 'Path to the resource icon of the notification'
				}
			}
		};

		RNCallKeep.setup(options);
	} catch (e) {
		if (!(e instanceof Error)) return;

		yield put(clientError(e.message));
	}
}

function* handleMockStartCall() {
	yield initCallKeep();

	RNCallKeep.startCall('someramdomid', '+5588764533', 'Hari Seldon', 'number', false);
}

function* handleMockRegister() {
	yield put(updateRegisterStatus('REGISTERING'));
	yield delay(5000);
	yield put(updateRegisterStatus('REGISTERED'));
	RNCallKeep.setAvailable(true);
	yield delay(5000);
	RNCallKeep.displayIncomingCall('someramdomid', '+5588764533', 'Hari Seldon', 'number', false);

	RNCallKeep.removeEventListener('answerCall');
	RNCallKeep.addEventListener('answerCall', () => {
		RNCallKeep.setCurrentCallActive('someramdomid');
	});
}

function* handleMockUnregister() {
	yield put(updateRegisterStatus('UNREGISTERING'));
	yield delay(5000);
	yield put(updateRegisterStatus('UNREGISTERED'));
	RNCallKeep.setAvailable(false);
}

export default function* root(): Generator {
	yield takeEvery(VOIP.START_CALL, handleMockStartCall);
	yield takeEvery(VOIP.REGISTER, handleMockRegister);
	yield takeEvery(VOIP.UNREGISTER, handleMockUnregister);
}

import { put, takeEvery } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';
import { eventChannel } from 'redux-saga';
import RNCallKeep from 'react-native-callkeep';
import { PermissionsAndroid } from 'react-native';
import { uniqueId } from 'lodash';

import { VOIP } from '../actions/actionsTypes';
import VoipClient from '../lib/voip/VoipClient';
import { appSelector } from '../lib/hooks';
import { parseStringToIceServers } from '../containers/Voip/utils/parseStringToIceServers';
import { Services } from '../lib/services';
import {
	clientError,
	TEndCallAction,
	// THoldCallAction,
	// TIncomingCallAction,
	// TMuteCallAction,
	TRegisterAction,
	// TSendDTMFAction,
	TStartCallAction,
	TUnregisterAction,
	updateSession
} from '../actions/voip';

// let voipClient: VoipClient;

function* attachCallKeepListeners(voipClient: VoipClient) {
	return eventChannel(() => {
		// RNCallKeep.addEventListener('didDisplayIncomingCall', onIncomingCallDisplayed);
		RNCallKeep.addEventListener('answerCall', () => voipClient.answer());
		RNCallKeep.addEventListener('endCall', () => voipClient.endCall());
		RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted }) => voipClient.setMute(muted));
		RNCallKeep.addEventListener('didPerformDTMFAction', ({ digits }) => voipClient.sendDTMF(digits));
		RNCallKeep.addEventListener('didReceiveStartCallAction', ({ handle }: { handle: string }) => {
			if (voipClient.isInCall()) {
				return;
			}

			voipClient.call(handle);
		});

		return () => {
			RNCallKeep.removeEventListener('didReceiveStartCallAction');
			RNCallKeep.removeEventListener('answerCall');
			RNCallKeep.removeEventListener('endCall');
			RNCallKeep.removeEventListener('didPerformSetMutedCallAction');
			RNCallKeep.removeEventListener('didPerformDTMFAction');
		};
	});
}

function* attachClientListeners(voipClient: VoipClient) {
	return eventChannel(emit => {
		voipClient.on('stateChanged', () => {
			emit(updateSession(voipClient.getSession()));
		});

		voipClient.on('incomingcall', session => {
			RNCallKeep.displayIncomingCall(session.id, session.contact.name || 'Unknown', session.contact.name, 'number', true);
		});

		voipClient.on('registered', () => {
			RNCallKeep.setAvailable(true);
		});

		voipClient.on('unregistered', () => {
			RNCallKeep.setAvailable(false);
		});

		voipClient.on('mute', muted => {
			RNCallKeep.setMutedCall('uniqueid', muted);
		});

		voipClient.on('hold', held => {
			RNCallKeep.setOnHold('uniqueid', held);
		});

		return () => {
			voipClient.off('stateChanged');
			voipClient.off('incomingcall');
		};
	});
}

function* getWebRtcServers() {
	const servers = yield* appSelector(state => state.settings.WebRTC_Servers);

	if (typeof servers !== 'string' || !servers.trim()) {
		return [];
	}

	return parseStringToIceServers(servers);
}

function* getConfig() {
	const userId = yield* appSelector(state => state.login.user.id);
	const host = yield* appSelector(state => state.settings.VoIP_TeamCollab_FreeSwitch_Host);

	if (!userId) {
		throw Error('error-user-not-found');
	}

	const iceServers = yield* getWebRtcServers();
	const registration = yield* call(Services.getRegistrationInfo, userId);

	if (!registration.success) {
		throw Error('error-registration-not-found');
	}

	const {
		extension: { extension },
		credentials: { websocketPath, password }
	} = registration;

	const config = {
		iceServers,
		authUserName: extension,
		authPassword: password,
		sipRegistrarHostnameOrIP: host as string, // TODO: error out if undefined
		webSocketURI: websocketPath,
		connectionRetryCount: Number(10), // TODO: get from settings
		enableKeepAliveUsingOptionsForUnstableNetworks: true // TODO: get from settings
	};

	return config;
}

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

function* initVoipClient() {
	const config = yield* getConfig();

	const voipClient = new VoipClient(config);

	yield call({ context: voipClient, fn: voipClient.init });

	return voipClient;
}

function* takeVoipActions(voipClient: VoipClient) {
	yield takeEvery<TStartCallAction>(VOIP.START_CALL, ({ payload: number }) => {
		voipClient.call(number);
		RNCallKeep.startCall(uniqueId(), number, number, 'number', false);
	});

	yield takeEvery<TEndCallAction>(VOIP.END_CALL, () => {
		if (!voipClient.isInCall()) {
			return;
		}

		voipClient.endCall();
		RNCallKeep.endCall(voipClient.getCallId());
	});

	yield takeEvery<TRegisterAction>(VOIP.REGISTER, () => {
		voipClient.register();
	});

	yield takeEvery<TUnregisterAction>(VOIP.UNREGISTER, () => {
		voipClient.unregister();
	});

	// yield takeEvery<TTransferCallAction>(VOIP.TRANSFER_CALL, handleTransferCall);

	// yield takeEvery<TChangeAudioOutputDevice>(VOIP.CHANGE_AUDIO_INPUT_DEVICE, handleOutputDevice);
	// yield takeEvery<TChangeAudioInputDevice>(VOIP.CHANGE_AUDIO_OUTPUT_DEVICE, handleAudioInputDevice);

	// yield takeEvery<TMuteCallAction>(VOIP.MUTE_CALL, ({ payload }) => voipClient.setMute(payload));
	// yield takeEvery<THoldCallAction>(VOIP.HOLD_CALL, ({ payload }) => voipClient.setHold(payload));
	// yield takeEvery<TSendDTMFAction>(VOIP.SEND_DTMF, ({ payload }) => voipClient.sendDTMF(payload));
}

function* handleVoipInit() {
	try {
		// const voipClient = yield* initVoipClient();
		// yield takeVoipActions(voipClient);
		// yield attachListeners(voipClient);

		yield initCallKeep();
		// yield attachCallKeepListeners(voipClient);
	} catch (e) {
		if (!(e instanceof Error)) return;

		yield put(clientError(e.message));
	}
}

export default function* root(): Generator {
	yield takeEvery(VOIP.INIT, handleVoipInit);
}

import { put, fork, takeEvery } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import RNCallKeep from 'react-native-callkeep';
import { PermissionsAndroid } from 'react-native';
import { call, take } from 'typed-redux-saga';

import { VOIP } from '../actions/actionsTypes';
import VoipClient from '../lib/voip/VoipClient';
import { appSelector } from '../lib/hooks';
import { parseStringToIceServers } from '../lib/voip/utils';
import { Services } from '../lib/services';
import {
	clientError,
	TActionVoip,
	TRegisterAction,
	TStartCallAction,
	TUnregisterAction,
	updateRegisterStatus,
	updateSession,
	updateState
} from '../actions/voip';

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
					PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
					PermissionsAndroid.PERMISSIONS.CALL_PHONE
				],
				// Required to get audio in background when using Android 11
				foregroundService: {
					channelId: 'chat.rocket.reactnative',
					channelName: 'Rocket.Chat',
					notificationTitle: `Voice call is running on background`
				}
			}
		};

		RNCallKeep.setup(options);
		RNCallKeep.canMakeMultipleCalls(false);
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

function* attachCallKeepListeners(voipClient: VoipClient) {
	const channel = eventChannel<TActionVoip>(emit => {
		RNCallKeep.addEventListener('answerCall', () => {
			const sessionId = voipClient.getSessionId();
			RNCallKeep.backToForeground();
			voipClient.answer();
			RNCallKeep.setCurrentCallActive(sessionId);
			console.log(`anwerCall ${sessionId}`);
		});

		RNCallKeep.addEventListener('endCall', () => {
			RNCallKeep.backToForeground();
			voipClient.endCall();
		});

		RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted }) => {
			voipClient.setMute(muted);
		});

		RNCallKeep.addEventListener('didPerformDTMFAction', ({ digits }) => {
			voipClient.sendDTMF(digits);
		});

		RNCallKeep.addEventListener('didReceiveStartCallAction', ({ handle }: { handle: string }) => {
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

	try {
		while (true) {
			const action = yield* take(channel);
			yield put(action);
		}
	} finally {
		channel.close();
	}
}

function* attachClientListeners(voipClient: VoipClient) {
	const channel = eventChannel<TActionVoip>(emit => {
		voipClient.on('stateChanged', () => {
			emit(updateSession(voipClient.getSession()));
			emit(updateState(voipClient.getState()));
		});

		voipClient.on('incomingcall', session => {
			console.log(`INCOMING CALL ${session.id}`);
			RNCallKeep.displayIncomingCall(session.id, session.contact.id, session.contact.name || 'Unknown', 'number', false);
		});

		voipClient.on('callestablished', session => {
			console.log(`ANSWERING CALL ${session.id}`);
			RNCallKeep.setCurrentCallActive(session.id);
		});

		voipClient.on('registered', () => {
			RNCallKeep.setAvailable(true);
			emit(updateRegisterStatus('REGISTERED'));
		});

		voipClient.on('unregistered', () => {
			RNCallKeep.setAvailable(false);
			emit(updateRegisterStatus('UNREGISTERED'));
		});

		voipClient.on('mute', ({ muted, session }) => {
			RNCallKeep.setMutedCall(session.id, muted);
		});

		voipClient.on('hold', ({ held, session }) => {
			RNCallKeep.setOnHold(session.id, held);
		});

		voipClient.on('callterminated', () => {
			console.log(`ENDING CALL`);
			RNCallKeep.backToForeground();
			RNCallKeep.endAllCalls();
			voipClient.endCall();
		});

		return () => {
			voipClient.off('stateChanged');
			voipClient.off('incomingcall');
			voipClient.off('callterminated');
			voipClient.off('hold');
			voipClient.off('mute');
			voipClient.off('callfailed');
			voipClient.off('registered');
			voipClient.off('unregistered');
			voipClient.off('callestablished');
			voipClient.off('registrationerror');
		};
	});

	try {
		while (true) {
			const action = yield* take(channel);
			yield put(action);
		}
	} finally {
		channel.close();
	}
}

function* takeVoipActions(voipClient: VoipClient) {
	yield takeEvery<TStartCallAction>(VOIP.START_CALL, async ({ payload: number }) => {
		await voipClient.call(number);
		console.log(`STARTING CALL ${voipClient.getSessionId()}`);
		RNCallKeep.startCall(voipClient.getSessionId(), number, number, 'number', false);
	});

	yield takeEvery<TRegisterAction>(VOIP.REGISTER, function* () {
		yield put(updateRegisterStatus('REGISTERING'));
		voipClient.register();
	});

	yield takeEvery<TUnregisterAction>(VOIP.UNREGISTER, function* () {
		yield put(updateRegisterStatus('UNREGISTERING'));
		voipClient.unregister();
	});
}

function* handleVoipInit() {
	try {
		const voipClient = yield* initVoipClient();
		yield fork(takeVoipActions, voipClient);
		yield fork(attachClientListeners, voipClient);

		yield initCallKeep();
		yield fork(attachCallKeepListeners, voipClient);
	} catch (e) {
		if (!(e instanceof Error)) return;

		yield put(clientError(e.message));
	}
}

export default function* root(): Generator {
	yield takeEvery(VOIP.INIT, handleVoipInit);
}

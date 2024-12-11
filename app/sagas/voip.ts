import { put, takeEvery } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';
import { eventChannel } from 'redux-saga';

import { VOIP } from '../actions/actionsTypes';
import VoipClient from '../lib/voip/VoipClient';
import { appSelector } from '../lib/hooks';
import { parseStringToIceServers } from '../containers/Voip/utils/parseStringToIceServers';
import { Services } from '../lib/services';
import { clientError, updateSession } from '../actions/voip';

export let voipClient: VoipClient;

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

function* attachListeners(voipClient: VoipClient) {
	return eventChannel(emit => {
		voipClient.on('stateChanged', () => {
			emit(updateSession(voipClient.getSession()));
		});

		return () => {
			voipClient.off('stateChanged');
		};
	});
}

function* handleVoipInit() {
	try {
		const config = yield* getConfig();

		const voipClient = new VoipClient(config);

		yield call({ context: voipClient, fn: voipClient.init });

		yield attachListeners(voipClient);
	} catch (e) {
		if (!(e instanceof Error)) return;

		yield put(clientError(e.stack));
	}
}

export default function* root(): Generator {
	yield takeEvery(VOIP.INIT, handleVoipInit);
}

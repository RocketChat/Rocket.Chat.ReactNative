import { Camera } from 'expo-camera';

import {
	beginConferenceCallOpen,
	currentConferenceCallOpen,
	expandConferenceCall
} from '../services/conference/conferenceCallNavigation';
import { preflightCallId, useConferenceCallStore } from '../services/conference/useConferenceCallStore';
import { store } from '../store/auxStore';
import { buildConferenceUrl } from './helpers/buildConferenceUrl';
import { isSecureHttpUrl } from './helpers/isConferenceUrl';
import log from './helpers/log';
import { requestVoipCallPermissions } from './voipCallPermissions';

type TConferenceTarget = { callId: string; rid?: string } | { rid: string };

const targetId = (target: TConferenceTarget): string => ('callId' in target ? target.callId : preflightCallId(target.rid));

const requestCallPermissions = async (): Promise<void> => {
	try {
		const camera = await Camera.getCameraPermissionsAsync();
		if (!camera?.granted) {
			await Camera.requestCameraPermissionsAsync();
		}
		await requestVoipCallPermissions();
	} catch (e) {
		log(e);
	}
};

export const openConferenceCall = async (target: TConferenceTarget): Promise<void> => {
	const { server } = store.getState().server;

	// An insecure server cannot be handed the login token this window authenticates with. Throwing
	// rather than returning keeps the caller's error handling in play — returning would leave the
	// user tapping Join to no effect.
	if (!isSecureHttpUrl(server)) {
		throw new Error(`Cannot open the conference window for an insecure server "${server}"`);
	}

	const url = buildConferenceUrl(server, target);

	if (!url) {
		throw new Error(`Cannot build a conference url for server "${server}"`);
	}

	const request = beginConferenceCallOpen();

	await requestCallPermissions();

	// From here on the call was deliberately superseded while the permission dialogs were up, so
	// these return quietly: there is nothing to tell the user about a call they themselves ended.
	if (request !== currentConferenceCallOpen()) {
		return;
	}
	if (store.getState().server.server !== server) {
		return;
	}

	useConferenceCallStore.getState().open({ callId: targetId(target), url, rid: target.rid, server });
	expandConferenceCall();
};

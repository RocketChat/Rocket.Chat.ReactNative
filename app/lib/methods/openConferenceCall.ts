import { Camera } from 'expo-camera';

import { currentConferenceCallOpen, expandConferenceCall } from '../services/conference/conferenceCallNavigation';
import { preflightCallId, useConferenceCallStore } from '../services/conference/useConferenceCallStore';
import { store } from '../store/auxStore';
import { buildConferenceUrl } from './helpers/buildConferenceUrl';
import { isConferenceWindowEnabled } from './helpers/isConferenceWindowEnabled';
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
	// These two mean the request cannot be served at all. Throwing rather than returning keeps the
	// caller's error handling in play — returning would leave the user tapping Join to no effect.
	if (!isConferenceWindowEnabled()) {
		throw new Error('Cannot open the conference window: it is disabled for this server');
	}

	const { server } = store.getState().server;
	const url = buildConferenceUrl(server, target);

	if (!url) {
		throw new Error(`Cannot build a conference url for server "${server}"`);
	}

	const request = currentConferenceCallOpen();

	await requestCallPermissions();

	// From here on the call was deliberately superseded while the permission dialogs were up, so
	// these return quietly: there is nothing to tell the user about a call they themselves ended.
	if (request !== currentConferenceCallOpen()) {
		return;
	}
	if (store.getState().server.server !== server) {
		return;
	}

	useConferenceCallStore.getState().open({ callId: targetId(target), url, rid: target.rid });
	expandConferenceCall();
};

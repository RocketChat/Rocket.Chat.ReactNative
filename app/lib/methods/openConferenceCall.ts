import { Camera } from 'expo-camera';

import { expandConferenceCall } from '../services/conference/conferenceCallNavigation';
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
	if (!isConferenceWindowEnabled()) {
		return;
	}

	const { server } = store.getState().server;
	const url = buildConferenceUrl(server, target);

	if (!url) {
		return;
	}

	await requestCallPermissions();

	useConferenceCallStore.getState().open({ callId: targetId(target), url, rid: target.rid });
	expandConferenceCall();
};

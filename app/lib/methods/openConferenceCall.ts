import { Camera } from 'expo-camera';

import Navigation from '../navigation/appNavigation';
import { useConferenceCallStore } from '../services/conference/useConferenceCallStore';
import { store } from '../store/auxStore';
import { buildConferenceUrl } from './helpers/buildConferenceUrl';
import log from './helpers/log';
import { handleAndroidBltPermission } from './handleAndroidBltPermission';
import { requestVoipCallPermissions } from './voipCallPermissions';

type TConferenceTarget = { callId: string } | { rid: string };

const targetId = (target: TConferenceTarget): string => ('callId' in target ? target.callId : `new:${target.rid}`);

const requestCallPermissions = async (): Promise<void> => {
	try {
		const camera = await Camera.getCameraPermissionsAsync();
		if (!camera?.granted) {
			await Camera.requestCameraPermissionsAsync();
		}
		await requestVoipCallPermissions();
		await handleAndroidBltPermission();
	} catch (e) {
		log(e);
	}
};

export const openConferenceCall = async (target: TConferenceTarget): Promise<void> => {
	const { server } = store.getState().server;
	const url = buildConferenceUrl(server, target);

	if (!url) {
		return;
	}

	await requestCallPermissions();

	useConferenceCallStore.getState().open({ callId: targetId(target), url });
	Navigation.navigate('ConferenceView');
};

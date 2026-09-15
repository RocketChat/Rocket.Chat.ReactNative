import { Camera } from 'expo-camera';
import { useMemo } from 'react';

import { useActionSheet } from '~/containers/ActionSheet';
import i18n from '~/i18n';
import { getUserSelector } from '~/selectors/login';
import { compareServerVersion } from '~/lib/methods/helpers/compareServerVersion';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import log from '~/lib/methods/helpers/log';
import { openConferenceCall } from '~/lib/methods/openConferenceCall';
import { requestVoipCallPermissions } from '~/lib/methods/voipCallPermissions';
import { videoConferenceGetCapabilities } from '~/lib/services/restApi';
import { useAppSelector } from '../useAppSelector';
import StartACallActionSheet from './StartACallActionSheet';
import { useVideoConfCall } from './useVideoConfCall';

const availabilityErrors = {
	NOT_CONFIGURED: 'video-conf-provider-not-configured',
	NOT_ACTIVE: 'no-active-video-conf-provider',
	NO_APP: 'no-videoconf-provider-app'
} as const;

const handleErrors = (isAdmin: boolean, error: keyof typeof availabilityErrors) => {
	const key = isAdmin ? `admin-${error}` : error;
	const body = `${key}-body`;
	const header = `${key}-header`;
	if (i18n.isTranslated(body) && i18n.isTranslated(header)) showErrorAlert(i18n.t(body), i18n.t(header));
};

export const useVideoConf = (
	rid: string
): { showInitCallActionSheet: () => Promise<void>; callEnabled: boolean; disabledTooltip?: boolean } => {
	const user = useAppSelector(state => getUserSelector(state));
	const serverVersion = useAppSelector(state => state.server.version);
	const { callEnabled, disabledTooltip, roomType } = useVideoConfCall(rid);

	const { showActionSheet } = useActionSheet();

	const isServer5OrNewer = useMemo(() => compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0'), [serverVersion]);

	const checkCallAvailability = async (): Promise<{ canInit: boolean; providerName?: string }> => {
		if (!callEnabled) return { canInit: false };

		if (isServer5OrNewer) {
			try {
				const capabilities = await videoConferenceGetCapabilities();
				return { canInit: true, providerName: capabilities.success ? capabilities.providerName : undefined };
			} catch (error: any) {
				const isAdmin = !!user.roles?.includes('admin');
				handleErrors(isAdmin, error?.data?.error || availabilityErrors.NOT_CONFIGURED);
				return { canInit: false };
			}
		}
		return { canInit: true };
	};

	const showInitCallActionSheet = async () => {
		try {
			const { canInit, providerName } = await checkCallAvailability();
			if (!canInit) {
				return;
			}

			if (providerName === 'livekit') {
				await openConferenceCall({ rid });
				return;
			}

			showActionSheet({
				children: <StartACallActionSheet rid={rid} roomType={roomType} />,
				portraitSnaps: ['60%'],
				landscapeSnaps: ['90%'],
				enableContentPanningGesture: false,
				fullContainer: true
			});

			const permission = await Camera.getCameraPermissionsAsync();
			try {
				if (!permission?.granted) {
					await Camera.requestCameraPermissionsAsync();
				}
				// Legacy Jitsi path is a WebView too, so BT headset audio needs the same grant.
				await requestVoipCallPermissions();
			} catch (error) {
				log(error);
			}
		} catch (error) {
			showErrorAlert(i18n.t('error-init-video-conf'));
			log(error);
		}
	};

	return { showInitCallActionSheet, callEnabled, disabledTooltip };
};

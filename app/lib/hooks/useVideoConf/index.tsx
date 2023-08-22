import { Camera } from 'expo-camera';
import React from 'react';

import { useActionSheet } from '../../../containers/ActionSheet';
import i18n from '../../../i18n';
import { getUserSelector } from '../../../selectors/login';
import { compareServerVersion, showErrorAlert } from '../../methods/helpers';
import { handleAndroidBltPermission } from '../../methods/videoConf';
import { Services } from '../../services';
import { useAppSelector } from '../useAppSelector';
import { useSnaps } from '../useSnaps';
import StartACallActionSheet from './StartACallActionSheet';
import { useVideoConfCall } from './useVideoConfCall';

const availabilityErrors = {
	NOT_CONFIGURED: 'video-conf-provider-not-configured',
	NOT_ACTIVE: 'no-active-video-conf-provider',
	NO_APP: 'no-videoconf-provider-app'
} as const;

const handleErrors = (isAdmin: boolean, error: typeof availabilityErrors[keyof typeof availabilityErrors]) => {
	if (isAdmin) return showErrorAlert(i18n.t(`admin-${error}-body`), i18n.t(`admin-${error}-header`));
	return showErrorAlert(i18n.t(`${error}-body`), i18n.t(`${error}-header`));
};

export const useVideoConf = (
	rid: string
): { showInitCallActionSheet: () => Promise<void>; callEnabled: boolean; disabledTooltip?: boolean } => {
	const user = useAppSelector(state => getUserSelector(state));
	const serverVersion = useAppSelector(state => state.server.version);

	const { callEnabled, disabledTooltip } = useVideoConfCall(rid);

	const [permission, requestPermission] = Camera.useCameraPermissions();

	const { showActionSheet } = useActionSheet();
	const snaps = useSnaps(404);

	const isServer5OrNewer = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0');

	const canInitAnCall = async () => {
		if (callEnabled) {
			if (isServer5OrNewer) {
				try {
					await Services.videoConferenceGetCapabilities();
					return true;
				} catch (error: any) {
					const isAdmin = !!user.roles?.includes('admin');
					switch (error?.error) {
						case availabilityErrors.NOT_CONFIGURED:
							return handleErrors(isAdmin, availabilityErrors.NOT_CONFIGURED);
						case availabilityErrors.NOT_ACTIVE:
							return handleErrors(isAdmin, availabilityErrors.NOT_ACTIVE);
						case availabilityErrors.NO_APP:
							return handleErrors(isAdmin, availabilityErrors.NO_APP);
						default:
							return handleErrors(isAdmin, availabilityErrors.NOT_CONFIGURED);
					}
				}
			}
			return true;
		}
		return false;
	};

	const showInitCallActionSheet = async () => {
		const canInit = await canInitAnCall();
		if (canInit) {
			showActionSheet({
				children: <StartACallActionSheet rid={rid} />,
				snaps
			});
			if (!permission?.granted) {
				requestPermission();
				handleAndroidBltPermission();
			}
		}
	};

	return { showInitCallActionSheet, callEnabled, disabledTooltip };
};

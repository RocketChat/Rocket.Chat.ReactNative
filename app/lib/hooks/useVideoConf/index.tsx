import { Camera } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

import { useActionSheet } from '../../../containers/ActionSheet';
import StartACallActionSheet from '../../../containers/UIKit/VideoConferenceBlock/components/StartACallActionSheet';
import { SubscriptionType } from '../../../definitions';
import i18n from '../../../i18n';
import { getUserSelector } from '../../../selectors/login';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import { compareServerVersion, showErrorAlert } from '../../methods/helpers';
import { handleAndroidBltPermission } from '../../methods/videoConf';
import { Services } from '../../services';
import { useAppSelector } from '../useAppSelector';
import { useSnaps } from '../useSnaps';

const availabilityErrors = {
	NOT_CONFIGURED: 'video-conf-provider-not-configured',
	NOT_ACTIVE: 'no-active-video-conf-provider',
	NO_APP: 'no-videoconf-provider-app'
} as const;

const handleErrors = (isAdmin: boolean, error: typeof availabilityErrors[keyof typeof availabilityErrors]) => {
	if (isAdmin) return showErrorAlert(i18n.t(`admin-${error}-body`), i18n.t(`admin-${error}-header`));
	return showErrorAlert(i18n.t(`${error}-body`), i18n.t(`${error}-header`));
};

export const useVideoConf = (rid: string): { showInitCallActionSheet: () => Promise<void>; showCallOption: boolean } => {
	const [showCallOption, setShowCallOption] = useState(false);

	const serverVersion = useAppSelector(state => state.server.version);
	const jitsiEnabled = useAppSelector(state => state.settings.Jitsi_Enabled);
	const jitsiEnableTeams = useAppSelector(state => state.settings.Jitsi_Enable_Teams);
	const jitsiEnableChannels = useAppSelector(state => state.settings.Jitsi_Enable_Channels);
	const user = useAppSelector(state => getUserSelector(state));

	const [permission, requestPermission] = Camera.useCameraPermissions();

	const isServer5OrNewer = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0');

	const { showActionSheet } = useActionSheet();
	const snaps = useSnaps([1250]);

	const handleShowCallOption = async () => {
		if (isServer5OrNewer) return setShowCallOption(true);
		const room = await getSubscriptionByRoomId(rid);

		if (room) {
			const isJitsiDisabledForTeams = room.teamMain && !jitsiEnableTeams;
			const isJitsiDisabledForChannels = !room.teamMain && (room.t === 'p' || room.t === 'c') && !jitsiEnableChannels;

			if (room.t === SubscriptionType.DIRECT) return setShowCallOption(!!jitsiEnabled);
			if (room.t === SubscriptionType.CHANNEL) return setShowCallOption(!isJitsiDisabledForChannels);
			if (room.t === SubscriptionType.GROUP) return setShowCallOption(!isJitsiDisabledForTeams);
		}

		return setShowCallOption(false);
	};

	const canInitAnCall = async () => {
		if (isServer5OrNewer) {
			try {
				await Services.videoConferenceGetCapabilities();
				return true;
			} catch (error: any) {
				const isAdmin = !!['admin'].find(role => user.roles?.includes(role));
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

	useEffect(() => {
		handleShowCallOption();
	}, []);

	return { showInitCallActionSheet, showCallOption };
};

export enum ESounds {
	DIALTONE = 'dialtone',
	RINGTONE = 'ringtone'
}

export const useVideoConfRinger = (ringer: ESounds) => {
	const sound = useRef<Audio.Sound | null>(null);
	useEffect(() => {
		(async () => {
			let expo = null;
			switch (ringer) {
				case ESounds.DIALTONE:
					expo = await Audio.Sound.createAsync(require(`./dialtone.mp3`));
					break;
				case ESounds.RINGTONE:
					expo = await Audio.Sound.createAsync(require(`./ringtone.mp3`));
					break;
				default:
					expo = await Audio.Sound.createAsync(require(`./dialtone.mp3`));
					break;
			}
			sound.current = expo.sound;
		})();
	}, []);

	useEffect(() => () => stopSound(), []);

	const playSound = async () => {
		if (sound.current) {
			await sound.current.playAsync();
			await sound.current.setIsLoopingAsync(true);
		}
	};

	const stopSound = () => {
		if (sound.current?.unloadAsync) {
			sound.current.unloadAsync();
		}
	};

	return { playSound, stopSound };
};

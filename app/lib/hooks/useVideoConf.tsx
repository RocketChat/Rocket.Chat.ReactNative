import React, { useEffect, useState } from 'react';

import { callJitsi } from '../methods';
import { compareServerVersion } from '../methods/helpers';
import { ISubscription, SubscriptionType } from '../../definitions';
import { useAppSelector } from './useAppSelector';
import { videoConfStartAndJoin } from '../methods/videoConf';
import { Services } from '../services';
import { useActionSheet } from '../../containers/ActionSheet';
import { useSnaps } from './useSnaps';
import StartACallActionSheet from '../../containers/UIKit/VideoConferenceBlock/components/StartACallActionSheet';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

export const useVideoConf = (rid: string): { showInitCallActionSheet: () => Promise<void>; showCallOption: boolean } => {
	const [showCallOption, setShowCallOption] = useState(false);

	const serverVersion = useAppSelector(state => state.server.version);
	const jitsiEnabled = useAppSelector(state => state.settings.Jitsi_Enabled);
	const jitsiEnableTeams = useAppSelector(state => state.settings.Jitsi_Enable_Teams);
	const jitsiEnableChannels = useAppSelector(state => state.settings.Jitsi_Enable_Channels);

	const greaterThanFive = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0');

	const { showActionSheet } = useActionSheet();
	const snaps = useSnaps([1250]);

	const handleShowCallOption = async () => {
		if (greaterThanFive) return setShowCallOption(true);
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
		if (greaterThanFive) {
			try {
				await Services.videoConferenceGetCapabilities();
				return true;
			} catch (error) {
				// TODO HANDLE ERROR
				return false;
			}
		}
		return true;
	};

	const initCall = async ({ cam, mic }: { cam: boolean; mic: boolean }) => {
		if (greaterThanFive) return videoConfStartAndJoin({ rid, cam, mic });
		const room = (await getSubscriptionByRoomId(rid)) as ISubscription;
		callJitsi({ room, cam });
	};

	const showInitCallActionSheet = async () => {
		const canInit = await canInitAnCall();
		if (canInit) {
			showActionSheet({
				children: <StartACallActionSheet rid={rid} initCall={initCall} />,
				snaps
			});
		}
	};

	useEffect(() => {
		handleShowCallOption();
	}, []);

	return { showInitCallActionSheet, showCallOption };
};

import React from 'react';

// import { callJitsi } from '../methods';
import { compareServerVersion } from '../methods/helpers';
import { ISubscription, SubscriptionType } from '../../definitions';
import { useAppSelector } from './useAppSelector';
// import { videoConfStartAndJoin } from '../methods/videoConf';
import { Services } from '../services';
import { useActionSheet } from '../../containers/ActionSheet';
import { useSnaps } from './useSnaps';
import StartACallActionSheet from '../../containers/UIKit/VideoConferenceBlock/components/StartACallActionSheet';

export const useVideoConf = (room: Pick<ISubscription, 'rid' | 't' | 'usernames' | 'name' | 'teamMain'>) => {
	const serverVersion = useAppSelector(state => state.server.version);
	const jitsiEnabled = useAppSelector(state => state.settings.Jitsi_Enabled);
	const jitsiEnableTeams = useAppSelector(state => state.settings.Jitsi_Enable_Teams);
	const jitsiEnableChannels = useAppSelector(state => state.settings.Jitsi_Enable_Channels);

	const greaterThanFive = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0');

	const { showActionSheet } = useActionSheet();
	const snaps = useSnaps([1250]);

	const showCallOption = () => {
		if (!room) return false;
		if (greaterThanFive) return true;

		const isJitsiDisabledForTeams = room.teamMain && !jitsiEnableTeams;
		const isJitsiDisabledForChannels = !room.teamMain && (room.t === 'p' || room.t === 'c') && !jitsiEnableChannels;

		if (room.t === SubscriptionType.DIRECT) return !!jitsiEnabled;
		if (room.t === SubscriptionType.CHANNEL) return !isJitsiDisabledForChannels;
		if (room.t === SubscriptionType.GROUP) return !isJitsiDisabledForTeams;
	};

	const canInitAnCall = async () => {
		if (greaterThanFive) {
			try {
				await Services.videoConferenceGetCapabilities();
				return true;
			} catch (error) {
				return false;
			}
		}
		return true;
	};

	// const initCall = (props: any) =>
	// 	greaterThanFive ? videoConfStartAndJoin(room.rid, ...props) : () => callJitsi(room, ...props);

	const press = async () => {
		const canInit = await canInitAnCall();
		if (canInit) {
			showActionSheet({
				children: <StartACallActionSheet rid={room.rid} />,
				snaps
			});
		}
	};

	return { initCall: press, showCallOption: showCallOption(), canInitAnCall };
};

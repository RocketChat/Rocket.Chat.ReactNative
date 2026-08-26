import { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { SubscriptionType } from '../../../definitions';
import { getUserSelector } from '../../../selectors/login';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import { isRoomFederated } from '../../methods/isRoomFederated';
import { compareServerVersion } from '../../methods/helpers/compareServerVersion';
import { isReadOnly } from '../../methods/helpers/isReadOnly';
import { useAppSelector } from '../useAppSelector';
import { usePermissions } from '../usePermissions';

export interface IUseVideoConfCall {
	callEnabled: boolean;
	disabledTooltip?: boolean;
	roomType?: SubscriptionType;
}

export const useVideoConfCall = (rid: string): IUseVideoConfCall => {
	const [callEnabled, setCallEnabled] = useState(false);
	const [disabledTooltip, setDisabledTooltip] = useState(false);
	const [roomType, setRoomType] = useState<SubscriptionType>();

	// Read all call-related settings in a single subscription instead of one useSetting per key.
	const settings = useAppSelector(
		state => ({
			jitsiEnabled: state.settings.Jitsi_Enabled,
			jitsiEnableTeams: state.settings.Jitsi_Enable_Teams,
			jitsiEnableChannels: state.settings.Jitsi_Enable_Channels,
			videoConfEnableDMs: state.settings.VideoConf_Enable_DMs,
			videoConfEnableChannels: state.settings.VideoConf_Enable_Channels,
			videoConfEnableTeams: state.settings.VideoConf_Enable_Teams,
			videoConfEnableGroups: state.settings.VideoConf_Enable_Groups,
			omnichannelCallProvider: state.settings.Omnichannel_call_provider
		}),
		shallowEqual
	);

	// OLD SETTINGS
	const { jitsiEnabled, jitsiEnableTeams, jitsiEnableChannels } = settings;

	// NEW SETTINGS
	// Only disable video conf if the settings are explicitly FALSE - any falsy value counts as true
	const enabledDMs = settings.videoConfEnableDMs !== false;
	const enabledChannel = settings.videoConfEnableChannels !== false;
	const enabledTeams = settings.videoConfEnableTeams !== false;
	const enabledGroups = settings.videoConfEnableGroups !== false;
	const enabledLiveChat = settings.omnichannelCallProvider === 'default-provider';

	const serverVersion = useAppSelector(state => state.server.version);
	const isServer5OrNewer = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0');
	const [canStartCall] = usePermissions(['call-management'], rid);
	const user = useAppSelector(state => getUserSelector(state));

	const init = async () => {
		const room = await getSubscriptionByRoomId(rid);
		if (room) {
			setRoomType(room.t);
			if (isServer5OrNewer) {
				const isReadyOnly = await isReadOnly(room, user.username);
				const ownUser = room.uids && room.uids.length === 1;
				const enabled = enabledDMs || enabledChannel || enabledTeams || enabledGroups || enabledLiveChat;
				const enableOption = enabled && canStartCall && (!user?.username || !room.muted?.includes(user.username));
				const federated = isRoomFederated(room);

				if (enableOption && !ownUser) {
					if (federated || (room.ro && isReadyOnly)) {
						setDisabledTooltip(true);
					}
					return setCallEnabled(true);
				}
				return;
			}
			// OLD SERVERS VERSIONS
			const isJitsiDisabledForTeams = room.teamMain && !jitsiEnableTeams;
			const isJitsiDisabledForChannels = !room.teamMain && (room.t === 'p' || room.t === 'c') && !jitsiEnableChannels;

			if (room.t === SubscriptionType.DIRECT) return setCallEnabled(!!jitsiEnabled);
			if (room.t === SubscriptionType.CHANNEL) return setCallEnabled(!isJitsiDisabledForChannels);
			if (room.t === SubscriptionType.GROUP) return setCallEnabled(!isJitsiDisabledForTeams);
		}
		return setCallEnabled(false);
	};

	useEffect(() => {
		init();
	}, []);

	return { callEnabled, disabledTooltip, roomType };
};

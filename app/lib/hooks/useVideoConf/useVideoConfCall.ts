import { useEffect, useState } from 'react';

import { SubscriptionType } from '../../../definitions';
import { getUserSelector } from '../../../selectors/login';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import { isRoomFederated } from '../../methods';
import { compareServerVersion, isReadOnly } from '../../methods/helpers';
import { useAppSelector } from '../useAppSelector';
import { usePermissions } from '../usePermissions';
import { useSetting } from '../useSetting';

export const useVideoConfCall = (
	rid: string
): { callEnabled: boolean; disabledTooltip?: boolean; roomType?: SubscriptionType } => {
	const [callEnabled, setCallEnabled] = useState(false);
	const [disabledTooltip, setDisabledTooltip] = useState(false);
	const [roomType, setRoomType] = useState<SubscriptionType>();

	// OLD SETTINGS
	const jitsiEnabled = useSetting('Jitsi_Enabled');
	const jitsiEnableTeams = useSetting('Jitsi_Enable_Teams');
	const jitsiEnableChannels = useSetting('Jitsi_Enable_Channels');

	// NEW SETTINGS
	// Only disable video conf if the settings are explicitly FALSE - any falsy value counts as true
	const enabledDMs = useSetting('VideoConf_Enable_DMs') !== false;
	const enabledChannel = useSetting('VideoConf_Enable_Channels') !== false;
	const enabledTeams = useSetting('VideoConf_Enable_Teams') !== false;
	const enabledGroups = useSetting('VideoConf_Enable_Groups') !== false;
	const enabledLiveChat = useSetting('Omnichannel_call_provider') === 'default-provider';

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

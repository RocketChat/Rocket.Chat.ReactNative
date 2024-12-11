// import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { parseStringToIceServers } from '../utils/parseStringToIceServers';
import { IceServer } from '../../../lib/voip/definitions';
import { useSetting } from '../../../lib/hooks/useSetting';

export const useWebRtcServers = (): IceServer[] => {
	const servers = useSetting('WebRTC_Servers');

	return useMemo(() => {
		if (typeof servers !== 'string' || !servers.trim()) {
			return [];
		}
		return parseStringToIceServers(servers);
	}, [servers]);
};

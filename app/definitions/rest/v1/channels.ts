import type { ChannelsEndpoints as RestTypingsChannelsEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type ChannelsEndpoints = AdaptEndpoints<RestTypingsChannelsEndpoints> & {
	'channels.convertToTeam': {
		POST: (params: { channelId: string; channelName?: string }) => unknown;
	};
};

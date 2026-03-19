import type { VideoConferenceEndpoints as RestTypingsVideoConferenceEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type VideoConferenceEndpoints = AdaptEndpoints<RestTypingsVideoConferenceEndpoints> & {
	'video-conference/jitsi.update-timeout': {
		POST: (params: { roomId: string }) => void;
	};
};

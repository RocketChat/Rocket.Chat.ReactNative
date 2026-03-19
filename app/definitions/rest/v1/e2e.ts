import type { E2eEndpoints as RestTypingsE2eEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type E2eEndpoints = AdaptEndpoints<RestTypingsE2eEndpoints> & {
	'e2e.resetRoomKey': {
		POST: (params: { rid: string; e2eKey: string; e2eKeyId: string }) => void;
	};
	'users.resetE2EKey': {
		POST: () => { success: boolean };
	};
};

import type { RoomsEndpoints as RestTypingsRoomsEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type RoomsEndpoints = AdaptEndpoints<RestTypingsRoomsEndpoints> & {
	'rooms.invite': {
		POST: (params: { roomId: string; action: 'accept' | 'reject' }) => void;
	};
};

export type TRoomsMediaResponse = {
	file: { _id: string; url: string };
};

import type { E2eEndpoints as RestTypingsE2eEndpoints } from '@rocket.chat/rest-typings';

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptE2eEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type E2eEndpoints = AdaptE2eEndpoints<RestTypingsE2eEndpoints> & {
	'e2e.resetRoomKey': {
		POST: (params: { rid: string; e2eKey: string; e2eKeyId: string }) => void;
	};
	'users.resetE2EKey': {
		POST: () => { success: boolean };
	};
};

import type { VideoConferenceEndpoints as RestTypingsVideoConferenceEndpoints } from '@rocket.chat/rest-typings';

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptVideoConferenceEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type VideoConferenceEndpoints = AdaptVideoConferenceEndpoints<RestTypingsVideoConferenceEndpoints> & {
	'video-conference/jitsi.update-timeout': {
		POST: (params: { roomId: string }) => void;
	};
};

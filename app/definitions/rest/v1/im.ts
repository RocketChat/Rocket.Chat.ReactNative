import type { ImEndpoints as RestTypingsImEndpoints } from '@rocket.chat/rest-typings';

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptImEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type ImEndpoints = AdaptImEndpoints<RestTypingsImEndpoints>;

import type { SubscriptionsEndpoints as RestTypingsSubscriptionsEndpoints } from '@rocket.chat/rest-typings';

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptSubscriptionsEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type SubscriptionsEndpoints = AdaptSubscriptionsEndpoints<RestTypingsSubscriptionsEndpoints>;

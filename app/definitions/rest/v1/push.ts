import type { Endpoints } from '@rocket.chat/rest-typings';

type ExtractPushEndpoints<T> = {
	[K in keyof T as K extends `/v1/push.${string}` ? K : never]: T[K];
};

type RestTypingsPushEndpoints = ExtractPushEndpoints<Endpoints>;

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptPushEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type PushEndpoints = AdaptPushEndpoints<RestTypingsPushEndpoints>;

import type { UsersEndpoints as RestTypingsUsersEndpoints } from '@rocket.chat/rest-typings';

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptUsersEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type UsersEndpoints = AdaptUsersEndpoints<RestTypingsUsersEndpoints>;

import type { RoomsEndpoints as RestTypingsRoomsEndpoints } from '@rocket.chat/rest-typings';

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptRoomsEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type RoomsEndpoints = AdaptRoomsEndpoints<RestTypingsRoomsEndpoints>;

export type TRoomsMediaResponse = {
	file: { _id: string; url: string };
};

import type { Endpoints } from '@rocket.chat/rest-typings';

type ExtractDirectoryEndpoint<T> = {
	[K in keyof T as K extends `/v1/directory` ? K : never]: T[K];
};

type RestTypingsDirectoryEndpoint = ExtractDirectoryEndpoint<Endpoints>;

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptDirectoryEndpoint<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type DirectoryEndpoint = AdaptDirectoryEndpoint<RestTypingsDirectoryEndpoint>;

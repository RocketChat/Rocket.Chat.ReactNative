import type { Endpoints } from '@rocket.chat/rest-typings';

type ExtractCustomUserStatusEndpoints<T> = {
	[K in keyof T as K extends `/v1/custom-user-status.${string}` ? K : never]: T[K];
};

type RestTypingsCustomUserStatusEndpoints = ExtractCustomUserStatusEndpoints<Endpoints>;

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptCustomUserStatusEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
		};

export type CustomUserStatusEndpoints = AdaptCustomUserStatusEndpoints<RestTypingsCustomUserStatusEndpoints>;

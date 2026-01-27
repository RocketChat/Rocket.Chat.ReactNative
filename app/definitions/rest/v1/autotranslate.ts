import type { Endpoints } from '@rocket.chat/rest-typings';

type ExtractAutoTranslateEndpoints<T> = {
	[K in keyof T as K extends `/v1/autotranslate.${string}` ? K : never]: T[K];
};

type RestTypingsAutoTranslateEndpoints = ExtractAutoTranslateEndpoints<Endpoints>;

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptAutoTranslateEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type AutoTranslateEndpoints = AdaptAutoTranslateEndpoints<RestTypingsAutoTranslateEndpoints>;

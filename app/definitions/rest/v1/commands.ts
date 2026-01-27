import type { Endpoints } from '@rocket.chat/rest-typings';

type ExtractCommandsEndpoints<T> = {
	[K in keyof T as K extends `/v1/commands.${string}` ? K : never]: T[K];
};

type RestTypingsCommandsEndpoints = ExtractCommandsEndpoints<Endpoints>;

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptCommandsEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};

export type CommandsEndpoints = AdaptCommandsEndpoints<RestTypingsCommandsEndpoints>;

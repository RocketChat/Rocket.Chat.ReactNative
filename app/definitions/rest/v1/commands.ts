import type { Endpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

type ExtractCommandsEndpoints<T> = {
	[K in keyof T as K extends `/v1/commands.${string}` ? K : never]: T[K];
};

type RestTypingsCommandsEndpoints = ExtractCommandsEndpoints<Endpoints>;

export type CommandsEndpoints = AdaptEndpoints<RestTypingsCommandsEndpoints>;

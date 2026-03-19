import type { Endpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

type ExtractCustomUserStatusEndpoints<T> = {
	[K in keyof T as K extends `/v1/custom-user-status.${string}` ? K : never]: T[K];
};

type RestTypingsCustomUserStatusEndpoints = ExtractCustomUserStatusEndpoints<Endpoints>;

export type CustomUserStatusEndpoints = AdaptEndpoints<RestTypingsCustomUserStatusEndpoints>;

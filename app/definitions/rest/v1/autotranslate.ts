import type { Endpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

type ExtractAutoTranslateEndpoints<T> = {
	[K in keyof T as K extends `/v1/autotranslate.${string}` ? K : never]: T[K];
};

type RestTypingsAutoTranslateEndpoints = ExtractAutoTranslateEndpoints<Endpoints>;

export type AutoTranslateEndpoints = AdaptEndpoints<RestTypingsAutoTranslateEndpoints>;

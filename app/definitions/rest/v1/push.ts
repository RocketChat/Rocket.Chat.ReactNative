import type { Endpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

type ExtractPushEndpoints<T> = {
	[K in keyof T as K extends `/v1/push.${string}` ? K : never]: T[K];
};

type RestTypingsPushEndpoints = ExtractPushEndpoints<Endpoints>;

export type PushEndpoints = AdaptEndpoints<RestTypingsPushEndpoints>;

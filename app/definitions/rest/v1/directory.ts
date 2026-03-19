import type { Endpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

type ExtractDirectoryEndpoint<T> = {
	[K in keyof T as K extends `/v1/directory` ? K : never]: T[K];
};

type RestTypingsDirectoryEndpoint = ExtractDirectoryEndpoint<Endpoints>;

export type DirectoryEndpoint = AdaptEndpoints<RestTypingsDirectoryEndpoint>;

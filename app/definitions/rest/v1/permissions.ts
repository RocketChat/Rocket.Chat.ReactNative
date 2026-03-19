import type { PermissionsEndpoints as RestTypingsPermissionsEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type PermissionsEndpoints = AdaptEndpoints<RestTypingsPermissionsEndpoints>;

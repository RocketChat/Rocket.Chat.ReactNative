import type { ImEndpoints as RestTypingsImEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type ImEndpoints = AdaptEndpoints<RestTypingsImEndpoints>;

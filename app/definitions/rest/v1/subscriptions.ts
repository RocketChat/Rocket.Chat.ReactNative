import type { SubscriptionsEndpoints as RestTypingsSubscriptionsEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type SubscriptionsEndpoints = AdaptEndpoints<RestTypingsSubscriptionsEndpoints>;

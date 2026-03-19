import type { GroupsEndpoints as RestTypingsGroupsEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type GroupsEndpoints = AdaptEndpoints<RestTypingsGroupsEndpoints>;

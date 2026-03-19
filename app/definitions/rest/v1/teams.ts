import type { TeamsEndpoints as RestTypingsTeamsEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type TeamsEndpoints = AdaptEndpoints<RestTypingsTeamsEndpoints>;

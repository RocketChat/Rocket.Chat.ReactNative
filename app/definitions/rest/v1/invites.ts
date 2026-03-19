import type { InvitesEndpoints as RestTypingsInvitesEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type InvitesEndpoints = AdaptEndpoints<RestTypingsInvitesEndpoints>;

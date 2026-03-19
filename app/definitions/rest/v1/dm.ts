import type { DmEndpoints as RestTypingsDmEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type DmEndpoints = AdaptEndpoints<RestTypingsDmEndpoints>;

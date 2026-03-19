import type { ModerationEndpoints as RestTypingsModerationEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type ModerationEndpoints = AdaptEndpoints<RestTypingsModerationEndpoints>;

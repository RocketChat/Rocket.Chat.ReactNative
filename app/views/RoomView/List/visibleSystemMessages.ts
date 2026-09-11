import { Q } from '@nozbe/watermelondb';

import { MESSAGE_TYPE_ANY_LOAD, type MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';

export const isLoaderMessage = (message: { t?: string }): boolean =>
	!!message.t && MESSAGE_TYPE_ANY_LOAD.includes(message.t as MessageTypeLoad);

export const isHiddenSystemMessage = (message: { t?: string }, hideSystemMessages: string[]): boolean =>
	!!message.t && !isLoaderMessage(message) && hideSystemMessages.includes(message.t);

/**
 * When the user hides system message types, applying `take(N)` before filtering would return
 * mostly hidden rows. This clause matches `isHiddenSystemMessage` so `take` applies to visible rows only.
 */
export function buildVisibleSystemTypesClause(hideSystemMessages: string[]): Q.Or | null {
	if (!hideSystemMessages.length) {
		return null;
	}

	const notHidden = Q.and(...hideSystemMessages.map(h => Q.where('t', Q.notEq(h))));

	return Q.or(Q.where('t', null), Q.where('t', Q.oneOf([...MESSAGE_TYPE_ANY_LOAD])), notHidden);
}

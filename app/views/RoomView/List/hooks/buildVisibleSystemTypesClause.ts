import { Q } from '@nozbe/watermelondb';

import { MESSAGE_TYPE_ANY_LOAD } from '../../../../lib/constants/messageTypeLoad';

/**
 * When the user hides system message types, applying `take(N)` before filtering would return
 * mostly hidden rows. This clause matches the JS filter `!m.t || !hideSystemMessages.includes(m.t)`
 * so `take` applies to visible rows only.
 */
export function buildVisibleSystemTypesClause(hideSystemMessages: string[]): Q.Or | null {
	if (!hideSystemMessages.length) {
		return null;
	}

	const notHidden = Q.and(...hideSystemMessages.map(h => Q.where('t', Q.notEq(h))));

	return Q.or(Q.where('t', null), Q.where('t', Q.oneOf([...MESSAGE_TYPE_ANY_LOAD])), notHidden);
}

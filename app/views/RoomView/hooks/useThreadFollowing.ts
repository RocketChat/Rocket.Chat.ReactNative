import { Q } from '@nozbe/watermelondb';
import { useMemo } from 'react';

import { type TMessageModel } from '../../../definitions';
import database from '../../../lib/database';
import { useObservable } from '../../../lib/hooks/useObservable';

export function useThreadFollowing(tmid?: string, userId?: string): boolean {
	const threadObservable = useMemo(
		() =>
			tmid
				? database.active.get<TMessageModel>('messages').query(Q.where('id', tmid)).observeWithColumns(['replies'])
				: undefined,
		[tmid]
	);
	const thread = useObservable(threadObservable)?.[0];

	if (!thread) {
		return true;
	}
	return thread.replies?.some(replyUserId => replyUserId === userId) ?? false;
}

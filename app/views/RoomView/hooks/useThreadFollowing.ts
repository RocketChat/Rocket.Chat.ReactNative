import { useEffect, useState } from 'react';

import database from '../../../lib/database';
import { type TMessageModel } from '../../../definitions';

export function useThreadFollowing(tmid?: string, userId?: string): boolean {
	'use memo';

	const [isFollowingThread, setIsFollowingThread] = useState(true);

	useEffect(() => {
		if (!tmid) {
			return;
		}
		let unsubscribe: (() => void) | undefined;
		database.active
			.get('messages')
			.find(tmid)
			.then((threadRecord: TMessageModel) => {
				const subscriptionRef = threadRecord.observe().subscribe(thread => {
					setIsFollowingThread((thread.replies && !!thread.replies.find(replyUserId => replyUserId === userId)) ?? false);
				});
				unsubscribe = () => subscriptionRef.unsubscribe();
			})
			.catch(() => console.log("Can't find message to observe."));

		return () => unsubscribe?.();
	}, [tmid, userId]);

	return isFollowingThread;
}

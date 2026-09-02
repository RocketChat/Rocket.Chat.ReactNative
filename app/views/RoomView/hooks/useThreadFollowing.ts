import { useEffect, useState } from 'react';

import { getMessageById } from '../../../lib/database/services/Message';

export function useThreadFollowing(tmid?: string, userId?: string): boolean {
	const [isFollowingThread, setIsFollowingThread] = useState(true);

	useEffect(() => {
		if (!tmid) {
			return;
		}
		let cancelled = false;
		let unsubscribe: (() => void) | undefined;
		getMessageById(tmid).then(threadRecord => {
			if (cancelled || !threadRecord) {
				return;
			}
			const subscription = threadRecord.observe().subscribe(thread => {
				setIsFollowingThread(thread.replies?.some(replyUserId => replyUserId === userId) ?? false);
			});
			unsubscribe = () => subscription.unsubscribe();
		});

		return () => {
			cancelled = true;
			unsubscribe?.();
		};
	}, [tmid, userId]);

	return isFollowingThread;
}

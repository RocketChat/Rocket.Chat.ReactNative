import { getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import UserPreferences from '../userPreferences';
import { syncWatchOSQuickReplies } from './syncReplies';
import { shouldShowWatchAppOptions } from './getWatchStatus';
import { QUICK_REPLIES_MAX, QUICK_REPLY_MAX_LENGTH } from './constants';

export const syncWatchOSQuickRepliesWithServer = (server: string, appleWatchReplies?: unknown): void => {
	if (!shouldShowWatchAppOptions()) return;
	if (!server) return;

	const quickRepliesMMKVKey = getWatchOSQuickRepliesKey(server);

	if (!UserPreferences.contains(quickRepliesMMKVKey) && typeof appleWatchReplies === 'string') {
		const replies = [
			...new Set(
				appleWatchReplies
					.split(',')
					.map(reply => Array.from(reply.trim()).slice(0, QUICK_REPLY_MAX_LENGTH).join('').trim())
					.filter(Boolean)
			)
		].slice(0, QUICK_REPLIES_MAX);
		if (replies.length) UserPreferences.setMap(quickRepliesMMKVKey, replies);
	}
	syncWatchOSQuickReplies(server);
};

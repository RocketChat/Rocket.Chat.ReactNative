import { getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import UserPreferences from '../userPreferences';
import { syncWatchOSQuickReplies } from './syncReplies';
import { shouldShowWatchAppOptions } from './getWatchStatus';
import { QUICK_REPLIES_MAX, QUICK_REPLY_MAX_LENGTH } from './constants';

export const syncWatchOSQuickRepliesWithServer = (server: string, appleWatchReplies?: unknown): boolean => {
	if (!shouldShowWatchAppOptions()) return false;
	if (!server) return false;

	const quickRepliesMMKVKey = getWatchOSQuickRepliesKey(server);

	if (!UserPreferences.contains(quickRepliesMMKVKey) && typeof appleWatchReplies === 'string') {
		const replies = [
			...new Set(
				appleWatchReplies
					.split(',')
					.map(reply => Array.from(reply.trim()).slice(0, QUICK_REPLY_MAX_LENGTH).join(''))
					.filter(Boolean)
			)
		].slice(0, QUICK_REPLIES_MAX);
		if (replies.length) UserPreferences.setMap(quickRepliesMMKVKey, replies);
	}
	return syncWatchOSQuickReplies(server);
};

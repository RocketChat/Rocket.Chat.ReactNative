import type { TSettingsState } from '~/reducers/settings';
import UserPreferences from '../userPreferences';
import { syncWatchOSQuickReplies } from './syncWatchOSQuickReplies';
import { saveWatchOSQuickReplies } from './saveWatchOSQuickReplies';
import { getQuickRepliesKey } from './getQuickRepliesKey';
import { getQuickRepliesLimits } from './getQuickRepliesLimits';

export const syncWatchOSQuickRepliesWithServer = (server: string, settings: TSettingsState): void => {
	const quickRepliesMMKVKey = getQuickRepliesKey(server);
	const appleWatchReplies = settings.Apple_Watch_Quick_Actions;

	if (!UserPreferences.contains(quickRepliesMMKVKey) && typeof appleWatchReplies === 'string') {
		const { max, maxLength } = getQuickRepliesLimits(settings);
		const replies = [
			...new Set(
				appleWatchReplies
					.split(',')
					.map(reply => Array.from(reply.trim()).slice(0, maxLength).join('').trim())
					.filter(Boolean)
			)
		].slice(0, max);
		if (replies.length) {
			saveWatchOSQuickReplies(server, replies);
			return;
		}
	}
	syncWatchOSQuickReplies(server);
};

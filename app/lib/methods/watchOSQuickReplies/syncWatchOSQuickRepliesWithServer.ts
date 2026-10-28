import { getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import type { TSettingsState } from '~/reducers/settings';
import UserPreferences from '../userPreferences';
import { syncWatchOSQuickReplies } from './syncReplies';
import { shouldShowWatchAppOptions } from './getWatchStatus';
import { getQuickRepliesLimits } from './getQuickRepliesLimits';

export const syncWatchOSQuickRepliesWithServer = (server: string, settings: TSettingsState): void => {
	if (!shouldShowWatchAppOptions()) return;
	if (!server) return;

	const quickRepliesMMKVKey = getWatchOSQuickRepliesKey(server);
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
		if (replies.length) UserPreferences.setMap(quickRepliesMMKVKey, replies);
	}
	syncWatchOSQuickReplies(server);
};

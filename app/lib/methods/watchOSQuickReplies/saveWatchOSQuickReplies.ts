import NativeWatchModule from '~/lib/native/NativeWatchModule';
import UserPreferences from '../userPreferences';
import { syncWatchOSQuickReplies } from './syncWatchOSQuickReplies';
import { getQuickRepliesKey } from './getQuickRepliesKey';

export const saveWatchOSQuickReplies = (server: string, replies?: string[]): void => {
	if (!NativeWatchModule) return;
	const key = getQuickRepliesKey(server);
	if (replies) {
		UserPreferences.setMap(key, replies);
	} else {
		UserPreferences.removeItem(key);
	}
	syncWatchOSQuickReplies(server);
};

import { WATCHOS_QUICKREPLIES } from '~/lib/constants/keys';
import UserPreferences from '../userPreferences';
import { syncWatchOSQuickReplies } from './syncReplies';
import { type IApplicationState } from '~/definitions';
import { shouldShowWatchAppOptions } from './getWatchStatus';

const syncWatchOSQuickRepliesWithServer = (state: IApplicationState): boolean => {
	if (!shouldShowWatchAppOptions()) return false;
	const { server } = state.server;
	const appleWatchReplies = state.settings.Apple_Watch_Quick_Actions;
	if (!server) return false;

	const quickRepliesMMKVKey = `${server}-${WATCHOS_QUICKREPLIES}`;

	// seed from the server setting only on first login, so user edits are never overwritten
	if (!UserPreferences.contains(quickRepliesMMKVKey) && appleWatchReplies && typeof appleWatchReplies === 'string') {
		const replies = appleWatchReplies
			.split(',')
			.map(reply => reply.trim())
			.filter(Boolean);
		UserPreferences.setString(quickRepliesMMKVKey, JSON.stringify(replies));
	}
	return syncWatchOSQuickReplies();
};
export default syncWatchOSQuickRepliesWithServer;

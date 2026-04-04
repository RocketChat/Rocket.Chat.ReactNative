import { WATCHOS_QUICKREPLIES } from '../../constants/keys';
import UserPreferences from '../userPreferences';
import { syncWatchOSQuickReplies } from './syncReplies';
import { type IApplicationState } from '../../../definitions';
import { shouldShowWatchAppOptions } from './getWatchStatus';
import { getWatchOSRepliesForServer } from './getWatchOSRepliesFromMMKV';

const syncWatchOSQuickRepliesWithServer = (state: IApplicationState): boolean => {
	if (!shouldShowWatchAppOptions()) return false;
	const { server } = state.server;
	const appleWatchReplies = state.settings.Apple_Watch_Quick_Actions;
	if (!server) return false;

	const isRepliesAvailable = getWatchOSRepliesForServer(server);

	// we use apple watch settings from server on first login
	if (!isRepliesAvailable && appleWatchReplies && typeof appleWatchReplies === 'string') {
		const quickRepliesMMKVKey = `${server}-${WATCHOS_QUICKREPLIES}`;

		const replies = appleWatchReplies.split(',').map(reply => reply.trim());
		UserPreferences.setArray(quickRepliesMMKVKey, replies);
	}
	const result = syncWatchOSQuickReplies();
	return result;
};
export default syncWatchOSQuickRepliesWithServer;

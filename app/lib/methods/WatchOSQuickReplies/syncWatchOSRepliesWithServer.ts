import { WATCHOS_QUICKREPLIES } from '../../constants/keys';
import UserPreferences from '../userPreferences';
import { syncWatchOSQuickReplies } from './syncReplies';
import { type IApplicationState } from '../../../definitions';
import { shouldShowWatchAppOptions } from './getWatchStatus';
import { getWatchOSRepliesForServer } from './getWatchOSRepliesFromMMKV';

const syncWatchOSQuickRepliesWithServer = (state: IApplicationState) => {
	if (!shouldShowWatchAppOptions()) return;
	const { server } = state.server;
	const appleWatchReplies = state.settings.Apple_Watch_Quick_Actions;
	if (!server) return;

	const isRepliesAvailable = getWatchOSRepliesForServer(server);

	console.log(isRepliesAvailable);
	// we use apple watch settings from server on first login
	if (!isRepliesAvailable && appleWatchReplies && typeof appleWatchReplies === 'string') {
		const quickRepliesMMKVKey = `${server}-${WATCHOS_QUICKREPLIES}`;

		const replies = appleWatchReplies.split(',');
		UserPreferences.setArray(quickRepliesMMKVKey, replies);
		console.log(UserPreferences.getArray(quickRepliesMMKVKey));
	}
	syncWatchOSQuickReplies();
};
export default syncWatchOSQuickRepliesWithServer;

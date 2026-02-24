import { WATCHOS_QUICKREPLIES } from '../../constants/keys';
import UserPreferences from '../userPreferences';
import { syncWatchOSQuickReplies } from './syncReplies';
import { type IApplicationState } from '../../../definitions';

const syncWatchOSQuickRepliesWithServer = (state: IApplicationState) => {
	const isFirstLogin = state.app.isFirstServerLogin;
	const { server } = state.server;
	const appleWatchReplies = state.settings.Apple_Watch_Quick_Actions;
	if (!server) return;

	if (isFirstLogin && appleWatchReplies && typeof appleWatchReplies === 'string') {
		if (server && appleWatchReplies) {
			const quickRepliesMMKVKey = `${server}-${WATCHOS_QUICKREPLIES}`;

			const replies = appleWatchReplies.split(',');
			UserPreferences.setArray(quickRepliesMMKVKey, replies);
		}
	}
	if (server) {
		syncWatchOSQuickReplies();
	}
};
export default syncWatchOSQuickRepliesWithServer;

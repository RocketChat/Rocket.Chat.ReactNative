import NativeWatchModule from '~/lib/native/NativeWatchModule';
import { CURRENT_SERVER, WATCHOS_QUICKREPLIES } from '~/lib/constants/keys';
import UserPreferences from '../userPreferences';
import log from '../helpers/log';
import { shouldShowWatchAppOptions } from './getWatchStatus';

export function syncWatchOSQuickReplies(): boolean {
	if (!shouldShowWatchAppOptions()) return false;
	try {
		const server = UserPreferences.getString(CURRENT_SERVER);
		if (!server) return false;
		const stored = UserPreferences.getMap(`${server}-${WATCHOS_QUICKREPLIES}`);
		const replies = Array.isArray(stored) ? stored : [];

		const result = NativeWatchModule?.syncQuickReplies(server, replies);
		if (result?.startsWith('[ERROR]')) {
			log(new Error(result));
			return false;
		}

		return true;
	} catch (e) {
		log(e);
		return false;
	}
}

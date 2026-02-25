import NativeWatchModule from '../../native/NativeWatchModule';
import { shouldShowWatchAppOptions } from './getWatchStatus';

export function syncWatchOSQuickReplies() {
	if (!shouldShowWatchAppOptions()) return;
	try {
		NativeWatchModule.syncQuickReplies();
		return true;
	} catch (e) {
		console.error('Failed to send quick replies', e);
		return false;
	}
}

import NativeWatchModule from '../../native/NativeWatchModule';
import { shouldShowWatchAppOptions } from './getWatchStatus';

export function syncWatchOSQuickReplies() {
	if (!shouldShowWatchAppOptions()) return;
	try {
		const result = NativeWatchModule?.syncQuickReplies();
		if (result?.startsWith('[ERROR]')) {
			console.error(result);
			return false;
		}

		return true;
	} catch (e) {
		console.error('Failed to send quick replies', e);
		return false;
	}
}

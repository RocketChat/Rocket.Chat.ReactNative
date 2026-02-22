import { NativeModules } from 'react-native';

import { WatchModule } from './WatchModule';

const { WatchBridge } = NativeModules;

export async function syncWatchOSQuickReplies(replies: string[]) {
	if (!Array.isArray(replies)) return false;

	try {
		const success: boolean = await WatchBridge.syncQuickReplies(replies);

		await WatchModule.syncQuickReplies();
		return success;
	} catch (e) {
		console.error('Failed to send quick replies', e);
		return false;
	}
}

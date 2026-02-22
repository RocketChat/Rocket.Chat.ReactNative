import { NativeModules } from 'react-native';

import NativeWatchModule from '../../native/NativeWatchModule';

const { WatchBridge } = NativeModules;

export async function syncWatchOSQuickReplies(replies: string[]) {
	if (!Array.isArray(replies)) return false;

	try {
		const success: boolean = await WatchBridge.syncQuickReplies(replies);

		console.log(NativeWatchModule.testModule());

		return success;
	} catch (e) {
		console.error('Failed to send quick replies', e);
		return false;
	}
}

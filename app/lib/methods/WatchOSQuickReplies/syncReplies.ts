import NativeWatchModule from '../../native/NativeWatchModule';

export function syncWatchOSQuickReplies() {
	try {
		// const success: boolean = await WatchBridge.syncQuickReplies(replies);

		console.log(NativeWatchModule.syncQuickReplies());
		console.log(NativeWatchModule.isWatchSupported());
		console.log(NativeWatchModule.isWatchPaired());
		console.log(NativeWatchModule.isWatchAppInstalled());
		console.log(NativeWatchModule.getCurrentServerFromNative());
		console.log(NativeWatchModule.getReplies());
		console.log(NativeWatchModule.getkey());

		return true;
	} catch (e) {
		console.error('Failed to send quick replies', e);
		return false;
	}
}

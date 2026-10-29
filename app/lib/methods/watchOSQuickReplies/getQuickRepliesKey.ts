import NativeWatchModule from '~/lib/native/NativeWatchModule';

export const getQuickRepliesKey = (server: string): string => {
	if (!NativeWatchModule) {
		throw new Error('The watch module is not available on this platform');
	}
	return NativeWatchModule.getQuickRepliesKey(server);
};

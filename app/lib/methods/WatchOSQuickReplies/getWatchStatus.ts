import NativeWatchModule from '~/lib/native/NativeWatchModule';

export const shouldShowWatchAppOptions = (): boolean => {
	if (!NativeWatchModule) return false;
	return NativeWatchModule.isWatchSupported() && NativeWatchModule.isWatchAppInstalled();
};

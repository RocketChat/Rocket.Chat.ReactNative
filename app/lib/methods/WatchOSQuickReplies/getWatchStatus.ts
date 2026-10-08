import NativeWatchModule from '~/lib/native/NativeWatchModule';
import { isAndroid } from '../helpers';

export const shouldShowWatchAppOptions = (): boolean => {
	if (isAndroid || !NativeWatchModule) return false;
	return NativeWatchModule.isWatchSupported() && NativeWatchModule.isWatchAppInstalled();
};

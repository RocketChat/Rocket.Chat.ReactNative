import NativeWatchModule from '~/lib/native/NativeWatchModule';

export const shouldShowWatchAppOptions = (): boolean => NativeWatchModule?.isWatchAppInstalled() ?? false;

import NativeWatchModule from '~/lib/native/NativeWatchModule';

export const isWatchAppInstalled = (): boolean => NativeWatchModule?.isWatchAppInstalled() ?? false;

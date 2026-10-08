import type { TurboModule } from 'react-native';
import { Platform, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	syncQuickReplies(server: string, replies: string[]): string;
	isWatchSupported(): boolean;
	isWatchPaired(): boolean;
	isWatchAppInstalled(): boolean;
}

const NativeWatchModule = Platform.OS === 'ios' ? TurboModuleRegistry.getEnforcing<Spec>('WatchModule') : null;

export default NativeWatchModule;

import type { TurboModule } from 'react-native';
import { Platform, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	syncQuickReplies(): void;
	isWatchSupported(): boolean;
	isWatchPaired(): boolean;
	isWatchAppInstalled(): boolean;
}

const NativeWatchModule = Platform.OS === 'ios' ? TurboModuleRegistry.getEnforcing<Spec>('WatchModule') : null;

export default NativeWatchModule;

import type { TurboModule } from 'react-native';
import { Platform, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	syncQuickReplies(server: string): string;
	getQuickRepliesKey(server: string): string;
	isWatchAppInstalled(): boolean;
}

const NativeWatchModule = Platform.OS === 'ios' ? TurboModuleRegistry.get<Spec>('WatchModule') : null;

export default NativeWatchModule;

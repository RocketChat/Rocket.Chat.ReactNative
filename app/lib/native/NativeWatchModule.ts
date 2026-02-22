import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	syncQuickReplies(): void;
	testModule(): string;
	isWatchSupported(): boolean;
	isWatchPaired(): boolean;
	isWatchAppInstalled(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WatchModule');

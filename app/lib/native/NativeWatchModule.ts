import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	syncQuickReplies(): void;
	isWatchSupported(): boolean;
	isWatchPaired(): boolean;
	isWatchAppInstalled(): boolean;

	// debug
	getCurrentServerFromNative(): string;
	getkey(): string;
	getReplies(): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WatchModule');

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	syncQuickReplies(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WatchModule');

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	getPendingAction(): Promise<string | null>;
	clearPendingAction(): void;
}

export default TurboModuleRegistry.get<Spec>('VideoConfModule');

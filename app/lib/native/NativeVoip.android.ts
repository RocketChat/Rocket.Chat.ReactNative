import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	getPendingVoipCall(): string | null;
	clearPendingVoipCall(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('VoipModule');

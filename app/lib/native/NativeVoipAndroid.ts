import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	getPendingVoipCall(): Promise<string | null>;
	clearPendingVoipCall(): void;
}

export default TurboModuleRegistry.get<Spec>('VoipModule');

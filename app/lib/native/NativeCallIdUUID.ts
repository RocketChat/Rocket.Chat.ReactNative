import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	toUUID(callId: string): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CallIdUUID');

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	startConferenceCallService(): Promise<void>;
	stopConferenceCallService(): void;
}

export default TurboModuleRegistry.get<Spec>('ConferenceCallModule');

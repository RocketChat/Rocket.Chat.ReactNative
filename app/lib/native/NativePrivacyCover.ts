import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	setEnabled(enabled: boolean): void;
	getCoverToken(): number;
	releaseCover(token: number): void;
}

export default TurboModuleRegistry.get<Spec>('PrivacyCover');

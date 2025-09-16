import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	setCertificate(server: string): Promise<null>;
	pickCertificate(): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SSLPinning');

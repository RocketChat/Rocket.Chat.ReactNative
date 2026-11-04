import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	setCertificate(name: string, server: string): Promise<null>;
	removeCertificate(server: string): void;
	pickCertificate(): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SSLPinning');

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	getPendingNotification(): Promise<string | null>;
	clearPendingNotification(): void;
}

export default TurboModuleRegistry.get<Spec>('PushNotificationModule');


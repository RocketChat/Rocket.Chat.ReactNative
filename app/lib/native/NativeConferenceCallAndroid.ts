import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	startConferenceCallService(): Promise<void>;
	stopConferenceCallService(): void;
	consumeOpenCallRequest(): Promise<boolean>;
	startMicLevelMonitor(): Promise<boolean>;
	stopMicLevelMonitor(): Promise<void>;
	setPictureInPictureEnabled(enabled: boolean): void;
	enterPictureInPicture(): Promise<boolean>;
}

export default TurboModuleRegistry.get<Spec>('ConferenceCallModule');

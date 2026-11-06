import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	startConferenceLiveActivity(title: string, micEnabled: boolean, labels: { mute: string; unmute: string; leave: string }): void;
	updateConferenceLiveActivity(micEnabled: boolean, labels: { mute: string; unmute: string; leave: string }): void;
	endConferenceLiveActivity(): void;
	addListener(eventType: string): void;
	removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('ConferenceLiveActivityModule');

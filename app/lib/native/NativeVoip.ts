import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	/**
	 * Registers for VoIP push notifications via PushKit.
	 * iOS: Triggers the system to request a VoIP push token.
	 * Android: No-op (uses FCM for push notifications).
	 */
	registerVoipToken(): void;

	/**
	 * Gets any pending VoIP call data.
	 * Returns null if no pending call or if data is older than 5 minutes.
	 * Clears the pending data after retrieval.
	 */
	getPendingVoipCall(): Object | null;

	/**
	 * Clears any pending VoIP call data.
	 */
	clearPendingVoipCall(): void;

	/**
	 * Required for NativeEventEmitter in TurboModules.
	 * Called when JS starts listening to events.
	 */
	addListener(eventName: string): void;

	/**
	 * Required for NativeEventEmitter in TurboModules.
	 * Called when JS stops listening to events.
	 */
	removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('VoipModule');

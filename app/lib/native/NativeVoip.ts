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
	 * Gets any initial events.
	 * Returns null if no initial events.
	 * Clears the initial events after retrieval.
	 */
	getInitialEvents(): Object | null;

	/**
	 * Clears any initial events.
	 */
	clearInitialEvents(): void;

	/**
	 * Gets the last known VoIP push token.
	 * iOS: Returns the cached PushKit token.
	 * Android: Returns an empty string.
	 */
	getLastVoipToken(): string;

	/**
	 * Stops the native DDP WebSocket listener used for early call-end detection.
	 * iOS: Disconnects the native DDP client that monitors media-signal hangup events.
	 * Android: No-op.
	 */
	stopNativeDDPClient(): void;

	/**
	 * Required for NativeEventEmitter in TurboModules.
	 * Called when JS starts listening to events.
	 * @platform android
	 */
	addListener(eventName: string): void;

	/**
	 * Required for NativeEventEmitter in TurboModules.
	 * Called when JS stops listening to events.
	 * @platform android
	 */
	removeListeners(count: number): void;
}

const NativeVoipModule =
	TurboModuleRegistry.get<Spec>('VoipModule') ??
	({
		registerVoipToken: () => undefined,
		getInitialEvents: () => null,
		clearInitialEvents: () => undefined,
		getLastVoipToken: () => '',
		stopNativeDDPClient: () => undefined,
		addListener: () => undefined,
		removeListeners: () => undefined
	} as Spec);

export default NativeVoipModule;

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
	 * Starts the VoIP foreground call service for an outgoing call.
	 * iOS: No-op (resolves).
	 * Android: Starts VoipCallService (microphone|phoneCall FGS) so RECORD_AUDIO keeps working
	 *   when the app is backgrounded. The promise stays pending until VoipCallService confirms
	 *   `startForeground` succeeded — async failures (ForegroundServiceTypeNotAllowedException,
	 *   SecurityException at startForeground time) reject with `E_VOIP_FGS_START`, sync
	 *   refusals (ForegroundServiceStartNotAllowedException dispatched by the framework)
	 *   reject with the same code, and no signal within ~7s rejects with `E_VOIP_FGS_TIMEOUT`.
	 *   Callers should tear the outgoing call down on rejection, otherwise mic capture will be
	 *   revoked ~5s after backgrounding.
	 */
	startVoipCallService(callId: string): Promise<void>;

	/**
	 * Stops the VoIP foreground call service.
	 * iOS: No-op.
	 * Android: Sends ACTION_STOP to VoipCallService, releasing the mic-type foreground hold.
	 */
	stopVoipCallService(): void;

	/**
	 * Routes call audio between speakerphone and earpiece.
	 * Android: API 31+ uses AudioManager.setCommunicationDevice(SPEAKER) for on,
	 *   clearCommunicationDevice() for off. Pre-31 falls back to MODE_IN_COMMUNICATION + setSpeakerphoneOn.
	 *   Required because the app's Telecom PhoneAccount is self-managed — Connection.setAudioRoute is a no-op.
	 * iOS: No-op stub. JS uses InCallManager.setForceSpeakerphoneOn directly.
	 */
	setSpeakerOn(on: boolean): Promise<boolean>;

	/** Android API 31+: registers OnCommunicationDeviceChangedListener; emits VoipCommunicationDeviceChanged events. No-op elsewhere. */
	startAudioRouteSync(): Promise<void>;

	/** Unregisters the listener. Safe to call multiple times. */
	stopAudioRouteSync(): Promise<void>;

	/**
	 * Plays the outgoing-call ringback (dialtone) on the voice-communication audio path so it
	 * follows the active comm device (earpiece/speaker/BT) instead of the music stream.
	 * Idempotent: a second call while playing is a no-op. iOS no-op (CallKit + AVAudioSession handle routing for expo-audio).
	 */
	startRingback(): Promise<void>;

	/** Stops and releases the ringback player. Safe to call when not playing. */
	stopRingback(): Promise<void>;

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
		startVoipCallService: () => Promise.resolve(),
		stopVoipCallService: () => undefined,
		setSpeakerOn: () => Promise.resolve(false),
		startAudioRouteSync: () => Promise.resolve(),
		stopAudioRouteSync: () => Promise.resolve(),
		startRingback: () => Promise.resolve(),
		stopRingback: () => Promise.resolve(),
		addListener: () => undefined,
		removeListeners: () => undefined
	} as Spec);

export default NativeVoipModule;

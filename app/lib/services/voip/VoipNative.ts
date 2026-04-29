import { DeviceEventEmitter, NativeEventEmitter, Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';

import type { VoipPayload } from '../../../definitions/Voip';
import NativeVoipModule from '../../native/NativeVoip';

// ── Types ────────────────────────────────────────────────────────────────────

export type VoipNativeEvent =
	| { type: 'endCall'; callUuid: string }
	| { type: 'mute'; muted: boolean; callUuid: string }
	| { type: 'hold'; hold: boolean; callUuid: string }
	| { type: 'pushTokenRegistered'; token: string }
	| { type: 'acceptSucceeded'; payload: VoipPayload; fromColdStart: boolean }
	| { type: 'acceptFailed'; payload: VoipPayload; fromColdStart: boolean };

export type Command =
	| { cmd: 'end'; callUuid: string }
	| { cmd: 'markActive'; callUuid: string }
	| { cmd: 'markAvailable'; callUuid: string }
	| { cmd: 'setSpeaker'; on: boolean }
	| { cmd: 'startAudio' }
	| { cmd: 'stopAudio' };

export type VoipNativeCallCommands = {
	end(callUuid: string): void;
	markActive(callUuid: string): void;
	markAvailable(callUuid: string): void;
	setSpeaker(on: boolean): Promise<void>;
	startAudio(): void;
	stopAudio(): void;
};

export type VoipNativePort = {
	attach(opts: { onEvent(e: VoipNativeEvent): void }): Promise<{ detach(): void; pushToken: string }>;
	readonly call: VoipNativeCallCommands;
};

// ── In-memory adapter (tests) ────────────────────────────────────────────────

export class InMemoryVoipNative implements VoipNativePort {
	readonly recorded: Command[] = [];
	private _onEvent: ((e: VoipNativeEvent) => void) | null = null;
	private _coldStartQueue: VoipNativeEvent[] = [];

	readonly call: VoipNativeCallCommands = {
		end: (callUuid: string) => {
			this.recorded.push({ cmd: 'end', callUuid });
		},
		markActive: (callUuid: string) => {
			this.recorded.push({ cmd: 'markActive', callUuid });
		},
		markAvailable: (callUuid: string) => {
			this.recorded.push({ cmd: 'markAvailable', callUuid });
		},
		setSpeaker: async (on: boolean) => {
			this.recorded.push({ cmd: 'setSpeaker', on });
		},
		startAudio: () => {
			this.recorded.push({ cmd: 'startAudio' });
		},
		stopAudio: () => {
			this.recorded.push({ cmd: 'stopAudio' });
		}
	};

	reset(): void {
		this.recorded.splice(0);
	}

	async attach(opts: { onEvent(e: VoipNativeEvent): void }): Promise<{ detach(): void; pushToken: string }> {
		this._onEvent = opts.onEvent;
		const seeds = this._coldStartQueue.splice(0);
		for (const event of seeds) {
			this._onEvent(event);
		}
		return {
			detach: () => {
				this._onEvent = null;
			},
			pushToken: ''
		};
	}

	__emit(event: VoipNativeEvent): void {
		this._onEvent?.(event);
	}

	__seedColdStart(events: VoipNativeEvent[]): void {
		this._coldStartQueue.push(...events);
	}
}

// ── Production adapter ───────────────────────────────────────────────────────

const EVENT_VOIP_ACCEPT_FAILED = 'VoipAcceptFailed';
const EVENT_VOIP_ACCEPT_SUCCEEDED = 'VoipAcceptSucceeded';

class ProductionVoipNative implements VoipNativePort {
	private _lastHandledAcceptSucceededCallId: string | null = null;
	private _lastHandledAcceptFailedCallId: string | null = null;

	readonly call: VoipNativeCallCommands = {
		end: (callUuid: string) => {
			try {
				RNCallKeep.endCall(callUuid);
			} catch {
				// CallKeep unavailable; still attempt Android service stop below
			}
			if (Platform.OS === 'android') {
				try {
					NativeVoipModule.stopVoipCallService();
				} catch {
					// bridge unavailable pre-boot
				}
			}
		},
		markActive: (callUuid: string) => {
			RNCallKeep.setCurrentCallActive(callUuid);
		},
		markAvailable: (callUuid: string) => {
			RNCallKeep.setCurrentCallActive('');
			RNCallKeep.setAvailable(true);
		},
		setSpeaker: async (on: boolean) => {
			if (Platform.OS === 'ios') {
				await InCallManager.setForceSpeakerphoneOn(on);
			} else {
				await NativeVoipModule.setSpeakerOn(on);
			}
		},
		startAudio: () => {
			InCallManager.start({ media: 'audio' });
		},
		stopAudio: () => {
			InCallManager.stop();
		}
	};

	async attach(opts: { onEvent(e: VoipNativeEvent): void }): Promise<{ detach(): void; pushToken: string }> {
		const { onEvent } = opts;

		// 1. Register WebRTC globals (lazy require avoids cascading import errors in unrelated tests)
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		(require('react-native-webrtc') as { registerGlobals(): void }).registerGlobals();

		// 2. Register PushKit token (iOS only)
		if (Platform.OS === 'ios') {
			NativeVoipModule.registerVoipToken();
		}

		// 3. Wire all listeners
		const Emitter = Platform.OS === 'ios' ? new NativeEventEmitter(NativeVoipModule) : DeviceEventEmitter;
		const subs: { remove(): void }[] = [];

		if (Platform.OS === 'ios') {
			subs.push(
				Emitter.addListener('VoipPushTokenRegistered', ({ token }: { token: string }) => {
					onEvent({ type: 'pushTokenRegistered', token });
				})
			);

			subs.push(
				RNCallKeep.addEventListener('endCall', ({ callUUID }: { callUUID: string }) => {
					this._lastHandledAcceptSucceededCallId = null;
					this._lastHandledAcceptFailedCallId = null;
					onEvent({ type: 'endCall', callUuid: callUUID });
				})
			);

			subs.push(
				RNCallKeep.addEventListener(
					'didPerformSetMutedCallAction',
					({ muted, callUUID }: { muted: boolean; callUUID: string }) => {
						onEvent({ type: 'mute', muted, callUuid: callUUID });
					}
				)
			);
		}

		subs.push(
			RNCallKeep.addEventListener('didToggleHoldCallAction', ({ hold, callUUID }: { hold: boolean; callUUID: string }) => {
				onEvent({ type: 'hold', hold, callUuid: callUUID });
			})
		);

		subs.push(
			Emitter.addListener(EVENT_VOIP_ACCEPT_SUCCEEDED, (data: VoipPayload) => {
				const { callId } = data;
				if (callId && this._lastHandledAcceptSucceededCallId === callId) {
					return;
				}
				if (data.type !== 'incoming_call') {
					return;
				}
				if (callId) {
					this._lastHandledAcceptSucceededCallId = callId;
				}
				onEvent({ type: 'acceptSucceeded', payload: data, fromColdStart: false });
			})
		);

		subs.push(
			Emitter.addListener(EVENT_VOIP_ACCEPT_FAILED, (data: VoipPayload) => {
				const { callId } = data;
				if (callId && this._lastHandledAcceptFailedCallId === callId) {
					return;
				}
				if (callId) {
					this._lastHandledAcceptFailedCallId = callId;
				}
				NativeVoipModule.clearInitialEvents();
				onEvent({ type: 'acceptFailed', payload: data, fromColdStart: false });
			})
		);

		// 4. Drain cold-start events
		await this._drainColdStart(onEvent);

		// 5. Resolve
		const pushToken = NativeVoipModule.getLastVoipToken();

		return {
			detach: () => {
				subs.forEach(s => s.remove());
				if (Platform.OS === 'ios') {
					NativeVoipModule.stopNativeDDPClient();
				}
			},
			pushToken
		};
	}

	private async _drainColdStart(onEvent: (e: VoipNativeEvent) => void): Promise<void> {
		const initialEvents = NativeVoipModule.getInitialEvents() as (VoipPayload & { voipAcceptFailed?: boolean }) | null;

		if (!initialEvents) {
			RNCallKeep.clearInitialEvents();
			return;
		}

		if (initialEvents.voipAcceptFailed && initialEvents.callId && initialEvents.host) {
			const { callId } = initialEvents;
			if (!callId || this._lastHandledAcceptFailedCallId !== callId) {
				if (callId) this._lastHandledAcceptFailedCallId = callId;
				onEvent({ type: 'acceptFailed', payload: initialEvents, fromColdStart: true });
			}
			RNCallKeep.clearInitialEvents();
			NativeVoipModule.clearInitialEvents();
			return;
		}

		if (!initialEvents.callId || !initialEvents.host || initialEvents.type !== 'incoming_call') {
			RNCallKeep.clearInitialEvents();
			return;
		}

		let wasAnswered = false;

		if (Platform.OS === 'ios') {
			const callKeepInitialEvents = await RNCallKeep.getInitialEvents();
			RNCallKeep.clearInitialEvents();

			for (const event of callKeepInitialEvents) {
				const { name, data } = event as { name: string; data: { callUUID?: string } };
				if (name === 'RNCallKeepPerformAnswerCallAction' && data?.callUUID === initialEvents.callId) {
					wasAnswered = true;
					break;
				}
			}
		} else {
			wasAnswered = true;
		}

		if (wasAnswered) {
			const { callId } = initialEvents;
			if (!callId || this._lastHandledAcceptSucceededCallId !== callId) {
				if (callId) this._lastHandledAcceptSucceededCallId = callId;
				onEvent({ type: 'acceptSucceeded', payload: initialEvents, fromColdStart: true });
			}
		}

		NativeVoipModule.clearInitialEvents();
	}
}

// ── Singleton ────────────────────────────────────────────────────────────────

export const voipNative: VoipNativePort = process.env.NODE_ENV === 'test' ? new InMemoryVoipNative() : new ProductionVoipNative();

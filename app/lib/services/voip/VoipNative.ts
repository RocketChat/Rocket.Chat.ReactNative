import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';

import NativeVoipModule from '../../native/NativeVoip';

// ── Types ────────────────────────────────────────────────────────────────────

export type VoipNativeEvent = never; // expanded in slice 4

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
	/** Slice 4 lights this up; throws until then. */
	attach(opts: { onEvent(e: VoipNativeEvent): void }): { detach(): void };
	readonly call: VoipNativeCallCommands;
};

// ── In-memory adapter (tests) ────────────────────────────────────────────────

export class InMemoryVoipNative implements VoipNativePort {
	readonly recorded: Command[] = [];

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

	// Throws until slice 4
	attach(_opts: { onEvent(e: VoipNativeEvent): void }): { detach(): void } {
		throw new Error('not yet implemented');
	}
}

// ── Production adapter ───────────────────────────────────────────────────────

class ProductionVoipNative implements VoipNativePort {
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

	// Throws until slice 4
	attach(_opts: { onEvent(e: VoipNativeEvent): void }): { detach(): void } {
		throw new Error('not yet implemented');
	}
}

// ── Singleton ────────────────────────────────────────────────────────────────

export const voipNative: VoipNativePort = process.env.NODE_ENV === 'test' ? new InMemoryVoipNative() : new ProductionVoipNative();

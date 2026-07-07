import { Component } from 'react';

/**
 * Dark stub for `expo-av`, dropped in Expo SDK 55. Reproduces the subset of its
 * surface this app uses as typed no-ops: audio/video playback and recording
 * are intentionally disabled, not migrated to expo-audio/expo-video.
 */

export type AVPlaybackStatus =
	| { isLoaded: false; error?: string }
	| {
			isLoaded: true;
			isPlaying: boolean;
			didJustFinish: boolean;
			durationMillis?: number;
			positionMillis: number;
			rate: number;
			shouldCorrectPitch: boolean;
			volume: number;
			isMuted: boolean;
			isLooping: boolean;
	  };

export enum InterruptionModeIOS {
	MixWithOthers = 0,
	DoNotMix = 1,
	DuckOthers = 2
}

export enum InterruptionModeAndroid {
	DoNotMix = 1,
	DuckOthers = 2
}

export interface AudioMode {
	allowsRecordingIOS: boolean;
	interruptionModeIOS: InterruptionModeIOS;
	playsInSilentModeIOS: boolean;
	staysActiveInBackground: boolean;
	interruptionModeAndroid: InterruptionModeAndroid;
	shouldDuckAndroid: boolean;
	playThroughEarpieceAndroid: boolean;
}

export interface RecordingOptionsAndroid {
	extension: string;
	outputFormat: number;
	audioEncoder: number;
	sampleRate?: number;
	numberOfChannels?: number;
	bitRate?: number;
}

export interface RecordingOptionsIOS {
	extension: string;
	outputFormat?: string | number;
	audioQuality: number;
	sampleRate: number;
	numberOfChannels: number;
	bitRate: number;
}

export interface RecordingOptions {
	isMeteringEnabled?: boolean;
	keepAudioActiveHint?: boolean;
	android: RecordingOptionsAndroid;
	ios: RecordingOptionsIOS;
	web: Record<string, unknown>;
}

export enum ResizeMode {
	CONTAIN = 'contain',
	COVER = 'cover',
	STRETCH = 'stretch'
}

const RESOLVED_PLAYBACK_STATUS: AVPlaybackStatus = {
	isLoaded: true,
	isPlaying: false,
	didJustFinish: false,
	positionMillis: 0,
	rate: 1,
	shouldCorrectPitch: false,
	volume: 1,
	isMuted: false,
	isLooping: false
};

const NOOP_PERMISSION_RESPONSE = { granted: false, status: 'undetermined', canAskAgain: true };

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Audio {
	export class Sound {
		static async createAsync(_source: unknown, _initialStatus?: unknown): Promise<{ sound: Sound; status: AVPlaybackStatus }> {
			return { sound: new Sound(), status: RESOLVED_PLAYBACK_STATUS };
		}

		async playAsync(): Promise<AVPlaybackStatus> {
			return RESOLVED_PLAYBACK_STATUS;
		}

		async pauseAsync(): Promise<AVPlaybackStatus> {
			return RESOLVED_PLAYBACK_STATUS;
		}

		async stopAsync(): Promise<AVPlaybackStatus> {
			return RESOLVED_PLAYBACK_STATUS;
		}

		async unloadAsync(): Promise<AVPlaybackStatus> {
			return RESOLVED_PLAYBACK_STATUS;
		}

		async loadAsync(_source: unknown): Promise<AVPlaybackStatus> {
			return RESOLVED_PLAYBACK_STATUS;
		}

		async setPositionAsync(_millis: number): Promise<AVPlaybackStatus> {
			return RESOLVED_PLAYBACK_STATUS;
		}

		async setRateAsync(_rate: number, _shouldCorrectPitch?: boolean): Promise<AVPlaybackStatus> {
			return RESOLVED_PLAYBACK_STATUS;
		}

		async setIsLoopingAsync(_isLooping: boolean): Promise<AVPlaybackStatus> {
			return RESOLVED_PLAYBACK_STATUS;
		}

		setOnPlaybackStatusUpdate(_callback: ((status: AVPlaybackStatus) => void) | null): void {}
	}

	export interface RecordingStatus {
		canRecord: boolean;
		isRecording: boolean;
		isDoneRecording: boolean;
		durationMillis: number;
		metering?: number;
		uri?: string | null;
	}

	export class Recording {
		async prepareToRecordAsync(_options?: RecordingOptions): Promise<RecordingStatus> {
			return { canRecord: true, isRecording: false, isDoneRecording: false, durationMillis: 0 };
		}

		setOnRecordingStatusUpdate(_callback: ((status: RecordingStatus) => void) | null): void {}

		async startAsync(): Promise<RecordingStatus> {
			return { canRecord: true, isRecording: true, isDoneRecording: false, durationMillis: 0 };
		}

		async stopAndUnloadAsync(): Promise<RecordingStatus> {
			return { canRecord: false, isRecording: false, isDoneRecording: true, durationMillis: 0 };
		}

		getURI(): string | null {
			return null;
		}
	}

	export const setAudioModeAsync = async (_mode: Partial<AudioMode>): Promise<void> => {};

	export const AndroidOutputFormat = { AAC_ADTS: 6 } as const;
	export const AndroidAudioEncoder = { AAC: 3 } as const;
	export const IOSAudioQuality = { MEDIUM: 0x40 } as const;
	export const IOSOutputFormat = { MPEG4AAC: 'aac ' } as const;

	export const RecordingOptionsPresets: Record<string, RecordingOptions> = {
		LOW_QUALITY: {
			android: {
				extension: '.3gp',
				outputFormat: AndroidOutputFormat.AAC_ADTS,
				audioEncoder: AndroidAudioEncoder.AAC,
				sampleRate: 44100,
				numberOfChannels: 2,
				bitRate: 128000
			},
			ios: {
				extension: '.caf',
				audioQuality: IOSAudioQuality.MEDIUM,
				outputFormat: IOSOutputFormat.MPEG4AAC,
				sampleRate: 44100,
				numberOfChannels: 2,
				bitRate: 128000
			},
			web: {}
		}
	};

	export const requestPermissionsAsync = async (): Promise<{ granted: boolean; status: string; canAskAgain: boolean }> => ({
		...NOOP_PERMISSION_RESPONSE
	});

	export const getPermissionsAsync = async (): Promise<{ granted: boolean; status: string; canAskAgain: boolean }> => ({
		...NOOP_PERMISSION_RESPONSE
	});
}

interface VideoProps {
	source?: unknown;
	rate?: number;
	volume?: number;
	isMuted?: boolean;
	resizeMode?: ResizeMode;
	shouldPlay?: boolean;
	isLooping?: boolean;
	style?: unknown;
	useNativeControls?: boolean;
	onLoad?: (status: AVPlaybackStatus) => void;
	onError?: (error: string) => void;
}

export class Video extends Component<VideoProps> {
	async stopAsync(): Promise<AVPlaybackStatus> {
		return RESOLVED_PLAYBACK_STATUS;
	}

	render() {
		return null;
	}
}

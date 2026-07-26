import { RecordingPresets } from 'expo-audio';

export const RECORDING_EXTENSION = '.aac';

export const RECORDING_PRESET = RecordingPresets.HIGH_QUALITY;

export const RECORDING_MODE = {
	playsInSilentMode: true,
	allowsRecording: true
} as const;

export const AUDIO_MODE = {
	playsInSilentMode: true,
	shouldPlayInBackground: true,
	allowsRecording: false,
	shouldRouteThroughEarpiece: false,
	interruptionMode: 'doNotMix' as const,
	interruptionModeAndroid: 'doNotMix' as const
} as const;

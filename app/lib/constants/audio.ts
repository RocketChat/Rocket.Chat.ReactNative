import { AudioQuality, IOSOutputFormat, type RecordingOptions, type AudioMode } from 'expo-audio';

export const RECORDING_EXTENSION = '.aac';

export const RECORDING_SETTINGS: RecordingOptions = {
	extension: RECORDING_EXTENSION,
	sampleRate: 44100,
	numberOfChannels: 1,
	bitRate: 64000,
	android: {
		outputFormat: 'aac_adts',
		audioEncoder: 'aac'
	},
	ios: {
		audioQuality: AudioQuality.MEDIUM,
		outputFormat: IOSOutputFormat.MPEG4AAC,
		linearPCMBitDepth: 16,
		linearPCMIsBigEndian: false,
		linearPCMIsFloat: false
	},
	web: {}
};

export const RECORDING_MODE: AudioMode = {
	playsInSilentMode: true,
	shouldPlayInBackground: true,
	allowsRecording: true,
	shouldRouteThroughEarpiece: false,
	interruptionMode: 'doNotMix',
	interruptionModeAndroid: 'doNotMix'
};

export const AUDIO_MODE: AudioMode = {
	playsInSilentMode: true,
	shouldPlayInBackground: true,
	allowsRecording: false,
	shouldRouteThroughEarpiece: false,
	interruptionMode: 'doNotMix',
	interruptionModeAndroid: 'doNotMix'
};

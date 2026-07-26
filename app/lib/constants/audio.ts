export const RECORDING_EXTENSION = '.aac';

export const RECORDING_SETTINGS = {
	extension: RECORDING_EXTENSION,
	sampleRate: 16000,
	numberOfChannels: 1,
	bitRate: 64000,
	android: {
		outputFormat: 'aac_adts' as const,
		audioEncoder: 'aac' as const
	},
	ios: {
		audioQuality: 64 as const,
		outputFormat: 'aac ' as const,
		linearPCMBitDepth: 16,
		linearPCMIsBigEndian: false,
		linearPCMIsFloat: false
	},
	web: {}
} as const;

export const RECORDING_MODE = {
	playsInSilentMode: true,
	shouldPlayInBackground: true,
	allowsRecording: true,
	shouldRouteThroughEarpiece: false,
	interruptionMode: 'doNotMix' as const,
	interruptionModeAndroid: 'doNotMix' as const
} as const;

export const AUDIO_MODE = {
	playsInSilentMode: true,
	shouldPlayInBackground: true,
	allowsRecording: false,
	shouldRouteThroughEarpiece: false,
	interruptionMode: 'doNotMix' as const,
	interruptionModeAndroid: 'doNotMix' as const
} as const;

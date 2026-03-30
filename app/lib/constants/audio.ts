import { type RecordingOptions } from 'expo-audio';

export const RECORDING_EXTENSION = '.aac';
export const RECORDING_SETTINGS: RecordingOptions = {
	android: {
		extension: RECORDING_EXTENSION,
		outputFormat: 'aac_adts',
		audioEncoder: 'aac',
		sampleRate: 44100
	},
	ios: {
		extension: RECORDING_EXTENSION,
		audioQuality: 64,
		outputFormat: 'aac',
		sampleRate: 44100
	},
	web: {},
	numberOfChannels: 1,
	bitRate: 192000,
	extension: RECORDING_EXTENSION,
	sampleRate: 44100
};

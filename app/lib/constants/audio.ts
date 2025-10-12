import { Audio, AudioMode, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { RecordingOptions } from 'expo-audio';

export const RECORDING_EXTENSION = '.aac';
export const RECORDING_SETTINGS: RecordingOptions = {
    android: {
        extension: RECORDING_EXTENSION,
        outputFormat: 'aac_adts',
        audioEncoder: 'aac',
        sampleRate: 44100,
    },
    ios: {
        extension: RECORDING_EXTENSION,
        audioQuality: 64,
        outputFormat: 'aac',
        sampleRate: 44100,
    },
    web: {},
    numberOfChannels: 1,
    bitRate: 192000,
    extension: RECORDING_EXTENSION,
    sampleRate: 44100
};

export const AUDIO_MODE: AudioMode = {
	allowsRecordingIOS: false,
	playsInSilentModeIOS: true,
	staysActiveInBackground: true,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: InterruptionModeIOS.DoNotMix,
	interruptionModeAndroid: InterruptionModeAndroid.DoNotMix
};

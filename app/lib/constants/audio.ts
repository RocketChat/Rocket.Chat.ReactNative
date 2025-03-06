import { Audio, AudioMode, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { RecordingOptions } from 'expo-av/build/Audio';

export const RECORDING_EXTENSION = '.aac';
export const RECORDING_SETTINGS: RecordingOptions = {
	android: {
		// Settings related to audio encoding.
		extension: RECORDING_EXTENSION,
		outputFormat: Audio.AndroidOutputFormat.AAC_ADTS,
		audioEncoder: Audio.AndroidAudioEncoder.AAC,
		// Settings related to audio quality.
		sampleRate: Audio.RecordingOptionsPresets.LOW_QUALITY.android.sampleRate,
		numberOfChannels: Audio.RecordingOptionsPresets.LOW_QUALITY.android.numberOfChannels,
		bitRate: Audio.RecordingOptionsPresets.LOW_QUALITY.android.bitRate
	},
	ios: {
		// Settings related to audio encoding.
		extension: RECORDING_EXTENSION,
		audioQuality: Audio.IOSAudioQuality.MEDIUM,
		outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
		// Settings related to audio quality.
		sampleRate: Audio.RecordingOptionsPresets.LOW_QUALITY.ios.sampleRate,
		numberOfChannels: Audio.RecordingOptionsPresets.LOW_QUALITY.ios.numberOfChannels,
		bitRate: Audio.RecordingOptionsPresets.LOW_QUALITY.ios.bitRate
	},
	web: {},
	keepAudioActiveHint: true
};

export const RECORDING_MODE: AudioMode = {
	allowsRecordingIOS: true,
	playsInSilentModeIOS: true,
	staysActiveInBackground: true,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: InterruptionModeIOS.DoNotMix,
	interruptionModeAndroid: InterruptionModeAndroid.DoNotMix
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

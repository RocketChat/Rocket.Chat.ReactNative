import { Options } from 'react-native-image-crop-picker';

export const imagePickerConfig = {
	cropping: true,
	avoidEmptySpaceAroundImage: false,
	freeStyleCropEnabled: true,
	forceJpg: true
};

export const libraryPickerConfig: Options = {
	multiple: true,
	compressVideoPreset: 'Passthrough',
	mediaType: 'any',
	forceJpg: true
};

export const videoPickerConfig: Options = {
	mediaType: 'video'
};

export const TIMEOUT_CLOSE_EMOJI_KEYBOARD = 300;

export const MIN_HEIGHT = 48;

export const NO_CANNED_RESPONSES = 'no-canned-responses';

// import { Options } from 'react-native-image-crop-picker';
import { ImagePickerOptions, MediaTypeOptions } from 'expo-image-picker';

import { TMarkdownStyle } from './interfaces';

export const IMAGE_PICKER_CONFIG: ImagePickerOptions = {
	// cropping: true,
	// avoidEmptySpaceAroundImage: false,
	// freeStyleCropEnabled: true,
	// forceJpg: true,
	// includeExif: true
	quality: 1
};

export const LIBRARY_PICKER_CONFIG: ImagePickerOptions = {
	allowsMultipleSelection: true,
	// multiple: true,
	// compressVideoPreset: 'Passthrough',
	// mediaType: 'any',
	exif: true
};

export const VIDEO_PICKER_CONFIG: ImagePickerOptions = {
	mediaTypes: MediaTypeOptions.Videos
};

export const TIMEOUT_CLOSE_EMOJI_KEYBOARD = 300;

export const MIN_HEIGHT = 48;
export const MAX_HEIGHT = 200;

export const NO_CANNED_RESPONSES = 'no-canned-responses';

export const MARKDOWN_STYLES: Record<TMarkdownStyle, string> = {
	bold: '*',
	italic: '_',
	strike: '~',
	code: '`',
	'code-block': '```'
};

export const COMPOSER_INPUT_PLACEHOLDER_MAX_LENGTH = 30;

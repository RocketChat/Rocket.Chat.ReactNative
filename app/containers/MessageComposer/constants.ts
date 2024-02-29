import { Options } from 'react-native-image-crop-picker';

import { TMarkdownStyle } from './interfaces';

export const IMAGE_PICKER_CONFIG = {
	cropping: true,
	avoidEmptySpaceAroundImage: false,
	freeStyleCropEnabled: true,
	forceJpg: true
};

export const LIBRARY_PICKER_CONFIG: Options = {
	multiple: true,
	compressVideoPreset: 'Passthrough',
	mediaType: 'any'
};

export const VIDEO_PICKER_CONFIG: Options = {
	mediaType: 'video'
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

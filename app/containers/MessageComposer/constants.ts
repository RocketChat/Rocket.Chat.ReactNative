import { ImagePickerOptions, MediaTypeOptions, UIImagePickerControllerQualityType } from 'expo-image-picker';

import { TMarkdownStyle } from './interfaces';

const imageQuality = 0.8;

const videoQuality = UIImagePickerControllerQualityType.High;

export const IMAGE_PICKER_CONFIG: ImagePickerOptions = {
	exif: true,
	quality: imageQuality
};

export const LIBRARY_PICKER_CONFIG: ImagePickerOptions = {
	allowsMultipleSelection: true,
	exif: true,
	mediaTypes: MediaTypeOptions.All,
	quality: imageQuality,
	videoQuality
};

export const VIDEO_PICKER_CONFIG: ImagePickerOptions = {
	mediaTypes: MediaTypeOptions.Videos,
	videoQuality
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

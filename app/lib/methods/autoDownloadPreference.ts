import { NetInfoStateType } from '@react-native-community/netinfo';

import {
	IMAGES_PREFERENCE_DOWNLOAD,
	AUDIO_PREFERENCE_DOWNLOAD,
	VIDEO_PREFERENCE_DOWNLOAD,
	MediaDownloadOption
} from '../constants';
import userPreferences from './userPreferences';
import { store } from '../store/auxStore';

type TMediaType = typeof IMAGES_PREFERENCE_DOWNLOAD | typeof AUDIO_PREFERENCE_DOWNLOAD | typeof VIDEO_PREFERENCE_DOWNLOAD;

export const fetchAutoDownloadEnabled = (mediaType: TMediaType) => {
	const { internetType } = store.getState().app;
	const mediaDownloadPreference = userPreferences.getString<MediaDownloadOption>(mediaType);

	let defaultValueByMediaType = false;
	if (mediaDownloadPreference === null) {
		if (mediaType === 'imagesPreferenceDownload') {
			// The same as 'wifi_mobile_data'
			defaultValueByMediaType = true;
		}
		if (mediaType === 'audioPreferenceDownload' || mediaType === 'videoPreferenceDownload') {
			// The same as 'wifi'
			defaultValueByMediaType = internetType === NetInfoStateType.wifi;
		}
	}

	return (
		(mediaDownloadPreference === 'wifi' && internetType === NetInfoStateType.wifi) ||
		mediaDownloadPreference === 'wifi_mobile_data' ||
		defaultValueByMediaType
	);
};

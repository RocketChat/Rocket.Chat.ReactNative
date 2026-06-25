import { NetInfoStateType } from '@react-native-community/netinfo';

import {
	type IMAGE_PREFERENCE_DOWNLOAD,
	type AUDIO_PREFERENCE_DOWNLOAD,
	type VIDEO_PREFERENCE_DOWNLOAD,
	type MediaDownloadOption
} from '../constants/mediaAutoDownload';
import userPreferences from './userPreferences';
import { store } from '../store/auxStore';

type TMediaType = typeof IMAGE_PREFERENCE_DOWNLOAD | typeof AUDIO_PREFERENCE_DOWNLOAD | typeof VIDEO_PREFERENCE_DOWNLOAD;

export const fetchAutoDownloadEnabled = (mediaType: TMediaType) => {
	const { netInfoState } = store.getState().app;
	const mediaDownloadPreference = userPreferences.getString(mediaType) as MediaDownloadOption;

	if (mediaDownloadPreference === 'wifi_mobile_data') {
		return true;
	}

	if (mediaDownloadPreference === 'wifi' && netInfoState === NetInfoStateType.wifi) {
		return true;
	}

	if (mediaDownloadPreference === null) {
		if (mediaType === 'imagePreferenceDownload') {
			return true;
		}
		if (mediaType === 'audioPreferenceDownload' || mediaType === 'videoPreferenceDownload') {
			return netInfoState === NetInfoStateType.wifi;
		}
	}

	return false;
};

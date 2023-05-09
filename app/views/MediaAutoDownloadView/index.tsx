import React from 'react';
import { useMMKVStorage } from 'react-native-mmkv-storage';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import ListPicker from './ListPicker';
import userPreferences from '../../lib/methods/userPreferences';
import {
	AUDIO_PREFERENCE_DOWNLOAD,
	IMAGES_PREFERENCE_DOWNLOAD,
	MediaDownloadOption,
	VIDEO_PREFERENCE_DOWNLOAD
} from '../../lib/constants';

const MMKV = userPreferences.getMMKV();

const MediaAutoDownload = () => {
	const [imagesPreference, setImagesPreference] = useMMKVStorage<MediaDownloadOption>(
		IMAGES_PREFERENCE_DOWNLOAD,
		MMKV,
		MediaDownloadOption.NEVER
	);
	const [videoPreference, setVideoPreference] = useMMKVStorage<MediaDownloadOption>(
		VIDEO_PREFERENCE_DOWNLOAD,
		MMKV,
		MediaDownloadOption.NEVER
	);
	const [audioPreference, setAudioPreference] = useMMKVStorage<MediaDownloadOption>(
		AUDIO_PREFERENCE_DOWNLOAD,
		MMKV,
		MediaDownloadOption.NEVER
	);

	return (
		<SafeAreaView testID='security-privacy-view'>
			<StatusBar />
			<List.Container testID='security-privacy-view-list'>
				<List.Section>
					<List.Separator />
					<ListPicker
						onChangeValue={setImagesPreference}
						value={imagesPreference}
						title='Images'
						testID='media-auto-download-view-images'
					/>
					<ListPicker
						onChangeValue={setVideoPreference}
						value={videoPreference}
						title='Video'
						testID='media-auto-download-view-video'
					/>
					<ListPicker
						onChangeValue={setAudioPreference}
						value={audioPreference}
						title='Audio'
						testID='media-auto-download-view-audio'
					/>
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default MediaAutoDownload;

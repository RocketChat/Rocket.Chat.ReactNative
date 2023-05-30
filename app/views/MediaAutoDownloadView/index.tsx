import React from 'react';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import ListPicker from './ListPicker';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import {
	AUDIO_PREFERENCE_DOWNLOAD,
	IMAGES_PREFERENCE_DOWNLOAD,
	MediaDownloadOption,
	VIDEO_PREFERENCE_DOWNLOAD
} from '../../lib/constants';

const MediaAutoDownload = () => {
	const [imagesPreference, setImagesPreference] = useUserPreferences<MediaDownloadOption>(
		IMAGES_PREFERENCE_DOWNLOAD,
		MediaDownloadOption.NEVER
	);
	const [videoPreference, setVideoPreference] = useUserPreferences<MediaDownloadOption>(
		VIDEO_PREFERENCE_DOWNLOAD,
		MediaDownloadOption.NEVER
	);
	const [audioPreference, setAudioPreference] = useUserPreferences<MediaDownloadOption>(
		AUDIO_PREFERENCE_DOWNLOAD,
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

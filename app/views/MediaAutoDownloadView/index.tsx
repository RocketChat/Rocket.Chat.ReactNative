import React, { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

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
import i18n from '../../i18n';
import { SettingsStackParamList } from '../../stacks/types';

const MediaAutoDownload = () => {
	const [imagesPreference, setImagesPreference] = useUserPreferences<MediaDownloadOption>(
		IMAGES_PREFERENCE_DOWNLOAD,
		'wifi_mobile_data'
	);
	const [videoPreference, setVideoPreference] = useUserPreferences<MediaDownloadOption>(VIDEO_PREFERENCE_DOWNLOAD, 'wifi');
	const [audioPreference, setAudioPreference] = useUserPreferences<MediaDownloadOption>(AUDIO_PREFERENCE_DOWNLOAD, 'wifi');
	const navigation = useNavigation<StackNavigationProp<SettingsStackParamList, 'MediaAutoDownloadView'>>();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: i18n.t('Media_auto_download')
		});
	}, [navigation]);

	return (
		<SafeAreaView>
			<StatusBar />
			<List.Container>
				<List.Section>
					<ListPicker onChangeValue={setImagesPreference} value={imagesPreference} title='Images' />
					<List.Separator />
					<ListPicker onChangeValue={setVideoPreference} value={videoPreference} title='Video' />
					<List.Separator />
					<ListPicker onChangeValue={setAudioPreference} value={audioPreference} title='Audio' />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default MediaAutoDownload;

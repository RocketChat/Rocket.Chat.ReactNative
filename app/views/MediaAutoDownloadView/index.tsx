import React, { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import ListPicker from './ListPicker';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import {
	AUDIO_PREFERENCE_DOWNLOAD,
	IMAGE_PREFERENCE_DOWNLOAD,
	type MediaDownloadOption,
	VIDEO_PREFERENCE_DOWNLOAD
} from '../../lib/constants/mediaAutoDownload';
import i18n from '../../i18n';
import { type SettingsStackParamList } from '../../stacks/types';

const MediaAutoDownload = () => {
	const [imagesPreference, setImagesPreference] = useUserPreferences<MediaDownloadOption>(
		IMAGE_PREFERENCE_DOWNLOAD,
		'wifi_mobile_data'
	);
	const [videoPreference, setVideoPreference] = useUserPreferences<MediaDownloadOption>(VIDEO_PREFERENCE_DOWNLOAD, 'wifi');
	const [audioPreference, setAudioPreference] = useUserPreferences<MediaDownloadOption>(AUDIO_PREFERENCE_DOWNLOAD, 'wifi');
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'MediaAutoDownloadView'>>();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: i18n.t('Media_auto_download')
		});
	}, [navigation]);

	return (
		<SafeAreaView>
			<List.Container>
				<List.Section>
					<List.Separator />
					<ListPicker onChangeValue={setImagesPreference} value={imagesPreference as MediaDownloadOption} title='Image' />
					<List.Separator />
					<ListPicker onChangeValue={setVideoPreference} value={videoPreference as MediaDownloadOption} title='Video' />
					<List.Separator />
					<ListPicker onChangeValue={setAudioPreference} value={audioPreference as MediaDownloadOption} title='Audio' />
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default MediaAutoDownload;

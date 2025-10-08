import React, { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import ListPicker from './ListPicker';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import {
	AUDIO_PREFERENCE_DOWNLOAD,
	IMAGE_PREFERENCE_DOWNLOAD,
	MEDIA_QUALITY,
	VIDEO_PREFERENCE_DOWNLOAD
} from '../../lib/constants/mediaAutoDownload';
import i18n from '../../i18n';
import { SettingsStackParamList } from '../../stacks/types';
import { MediaDownloadOption, MediaQualityOption } from '../../definitions/IMedia';

const MediaAutoDownload = () => {
	const [imagesPreference, setImagesPreference] = useUserPreferences<MediaDownloadOption>(
		IMAGE_PREFERENCE_DOWNLOAD,
		'wifi_mobile_data'
	);
  const [mediaQualityPreference, setMediaQualityPreference] = useUserPreferences<MediaQualityOption>(MEDIA_QUALITY, 'SD');
	const [videoPreference, setVideoPreference] = useUserPreferences<MediaDownloadOption>(VIDEO_PREFERENCE_DOWNLOAD, 'wifi');
	const [audioPreference, setAudioPreference] = useUserPreferences<MediaDownloadOption>(AUDIO_PREFERENCE_DOWNLOAD, 'wifi');
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'MediaAutoDownloadView'>>();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: i18n.t('Media')
		});
	}, [navigation]);

	const setMediaPref = (type: String) => {
    if (type === 'Media_quality_high_definition_title') {
      setMediaQualityPreference('HD');
		} else {
      setMediaQualityPreference('SD');
		}
	};

	return (
		<SafeAreaView>
			<List.Container>
				<List.Section title='Media_quality'>
					<List.Info info='Media_quality_info' />
					<List.Item
						title='Media_quality_standard_title'
						subtitle='Media_quality_standard_subtitle'
						onPress={setMediaPref}
            right={() => (mediaQualityPreference === 'SD' ? <List.Icon name='check' /> : <></>)}
					/>
					<List.Separator />
					<List.Item
						title='Media_quality_high_definition_title'
						subtitle='Media_quality_high_definition_subtitle'
						onPress={setMediaPref}
            right={() => (mediaQualityPreference === 'HD' ? <List.Icon name='check' /> : <></>)}
					/>
				</List.Section>
				<List.Section title='Media_auto_download'>
					<List.Separator />
					<ListPicker onChangeValue={setImagesPreference} value={imagesPreference} title='Image' />
					<List.Separator />
					<ListPicker onChangeValue={setVideoPreference} value={videoPreference} title='Video' />
					<List.Separator />
					<ListPicker onChangeValue={setAudioPreference} value={audioPreference} title='Audio' />
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default MediaAutoDownload;

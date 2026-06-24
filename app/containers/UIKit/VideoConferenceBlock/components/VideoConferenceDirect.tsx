import { memo } from 'react';
import { Text } from 'react-native';

import i18n from '../../../../i18n';
import styles from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

const VideoConferenceDirect = memo(() => (
	<VideoConferenceBaseContainer variant='incoming'>
		<Text style={styles.callBack}>{i18n.t('Waiting_for_answer')}</Text>
	</VideoConferenceBaseContainer>
));

export default VideoConferenceDirect;

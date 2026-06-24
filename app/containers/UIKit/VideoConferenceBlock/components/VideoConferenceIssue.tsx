import { memo } from 'react';
import { Text } from 'react-native';

import i18n from '../../../../i18n';
import styles from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

const VideoConferenceIssue = memo(() => (
	<VideoConferenceBaseContainer variant='issue'>
		<Text style={styles.callBack}>{i18n.t('Waiting_for_server_connection')}</Text>
	</VideoConferenceBaseContainer>
));

export default VideoConferenceIssue;

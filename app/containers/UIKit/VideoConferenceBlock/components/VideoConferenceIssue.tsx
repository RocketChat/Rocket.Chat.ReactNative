import { memo } from 'react';
import { PlainText } from 'react-native-plain-text';

import i18n from '~/i18n';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

const VideoConferenceIssue = memo(() => {
	const style = useStyle();

	return (
		<VideoConferenceBaseContainer variant='issue'>
			<PlainText style={style.callBack}>{i18n.t('Waiting_for_server_connection')}</PlainText>
		</VideoConferenceBaseContainer>
	);
});

export default VideoConferenceIssue;

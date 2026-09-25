import { memo } from 'react';
import { PlainText } from '~/containers/PlainText';

import i18n from '~/i18n';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

const VideoConferenceDirect = memo(() => {
	const style = useStyle();

	return (
		<VideoConferenceBaseContainer variant='incoming'>
			<PlainText style={style.callBack}>{i18n.t('Waiting_for_answer')}</PlainText>
		</VideoConferenceBaseContainer>
	);
});

export default VideoConferenceDirect;

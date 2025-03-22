import React from 'react';
import { Text } from 'react-native';

import i18n from '../../../../i18n';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

const VideoConferenceDirect = React.memo(() => {
	const style = useStyle();

	return (
		<VideoConferenceBaseContainer variant='incoming'>
			<Text style={style.callBack}>{i18n.t('Waiting_for_answer')}</Text>
		</VideoConferenceBaseContainer>
	);
});

export default VideoConferenceDirect;

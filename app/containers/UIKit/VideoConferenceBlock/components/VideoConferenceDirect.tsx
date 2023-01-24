import React from 'react';
import { Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import i18n from '../../../../i18n';
import { useVideoConf } from '../../../../lib/hooks/useVideoConf';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

const VideoConferenceDirect = React.memo(({ blockId }: { blockId: string }) => {
	const style = useStyle();
	const { joinCall } = useVideoConf();

	return (
		<VideoConferenceBaseContainer variant='incoming'>
			<Touchable style={style.callToActionButton} onPress={() => joinCall(blockId)}>
				<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
			</Touchable>
			<Text style={style.callBack}>{i18n.t('Waiting_for_answer')}</Text>
		</VideoConferenceBaseContainer>
	);
});

export default VideoConferenceDirect;

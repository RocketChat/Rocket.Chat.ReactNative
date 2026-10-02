import { memo } from 'react';
import { Text } from 'react-native';

import i18n from '~/i18n';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

const VideoConferenceDirect = memo(({ discussionRid }: { discussionRid?: string }) => {
	const style = useStyle();

	return (
		<VideoConferenceBaseContainer variant='incoming' discussionRid={discussionRid}>
			<Text style={style.callBack}>{i18n.t('Waiting_for_answer')}</Text>
		</VideoConferenceBaseContainer>
	);
});

export default VideoConferenceDirect;

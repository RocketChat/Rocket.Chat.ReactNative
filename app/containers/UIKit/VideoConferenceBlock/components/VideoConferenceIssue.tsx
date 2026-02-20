import { Text } from 'react-native';
import { memo } from 'react';

import i18n from '../../../../i18n';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

const VideoConferenceIssue = () => {
	const style = useStyle();

	return (
		<VideoConferenceBaseContainer variant='issue'>
			<Text style={style.callBack}>{i18n.t('Waiting_for_server_connection')}</Text>
		</VideoConferenceBaseContainer>
	);
};

export default memo(VideoConferenceIssue);

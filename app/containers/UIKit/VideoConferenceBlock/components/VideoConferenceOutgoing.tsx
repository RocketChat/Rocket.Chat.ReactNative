import React from 'react';
import { Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import i18n from '../../../../i18n';
import { useVideoConf } from '../../../../lib/hooks/useVideoConf';
import { CallParticipants, TCallUsers } from './CallParticipants';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

export default function VideoConferenceOutgoing({ users, blockId }: { users: TCallUsers; blockId: string }): React.ReactElement {
	const style = useStyle();
	const { joinCall } = useVideoConf();

	return (
		<VideoConferenceBaseContainer variant='outgoing'>
			<Touchable style={style.callToActionButton} onPress={() => joinCall(blockId)}>
				<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
			</Touchable>
			<CallParticipants users={users} />
		</VideoConferenceBaseContainer>
	);
}

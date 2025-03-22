import React from 'react';
import { Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import i18n from '../../../../i18n';
import { videoConfJoin } from '../../../../lib/methods/videoConf';
import { CallParticipants, TCallUsers } from './CallParticipants';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

export default function VideoConferenceOutgoing({ users, blockId }: { users: TCallUsers; blockId: string }): React.ReactElement {
	const style = useStyle();

	return (
		<VideoConferenceBaseContainer variant='outgoing'>
			<Touchable style={style.callToActionButton} onPress={() => videoConfJoin(blockId)}>
				<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
			</Touchable>
			<CallParticipants users={users} />
		</VideoConferenceBaseContainer>
	);
}

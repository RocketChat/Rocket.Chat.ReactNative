import React from 'react';
import { Text } from 'react-native';

import i18n from '../../../../i18n';
import { videoConfJoin } from '../../../../lib/methods/videoConf';
import { CallParticipants, type TCallUsers } from './CallParticipants';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';
import Touch from '../../../Touch';

export default function VideoConferenceOutgoing({ users, blockId }: { users: TCallUsers; blockId: string }): React.ReactElement {
	const style = useStyle();

	return (
		<VideoConferenceBaseContainer variant='outgoing'>
			<Touch style={style.callToActionButton} onPress={() => videoConfJoin(blockId)}>
				<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
			</Touch>
			<CallParticipants users={users} />
		</VideoConferenceBaseContainer>
	);
}

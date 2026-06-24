import { type ReactElement } from 'react';
import { Text } from 'react-native';

import i18n from '../../../../i18n';
import { videoConfJoin } from '../../../../lib/methods/videoConf';
import { CallParticipants, type TCallUsers } from './CallParticipants';
import styles from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';
import Touch from '../../../Touch';

export default function VideoConferenceOutgoing({ users, blockId }: { users: TCallUsers; blockId: string }): ReactElement {
	return (
		<VideoConferenceBaseContainer variant='outgoing'>
			<Touch style={styles.callToActionButton} onPress={() => videoConfJoin(blockId)}>
				<Text style={styles.callToActionButtonText}>{i18n.t('Join')}</Text>
			</Touch>
			<CallParticipants users={users} />
		</VideoConferenceBaseContainer>
	);
}

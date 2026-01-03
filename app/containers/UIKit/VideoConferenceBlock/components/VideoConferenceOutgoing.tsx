import React from 'react';
import { Text } from 'react-native';

import i18n from '../../../../i18n';
import { videoConfJoin } from '../../../../lib/methods/videoConf';
import { CallParticipants, type TCallUsers } from './CallParticipants';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';
import PressableOpacity from '../../../PressableOpacity';
import { useTheme } from '../../../../theme';

export default function VideoConferenceOutgoing({ users, blockId }: { users: TCallUsers; blockId: string }): React.ReactElement {
	const style = useStyle();
	const { colors } = useTheme();
	return (
		<VideoConferenceBaseContainer variant='outgoing'>
			<PressableOpacity
				style={style.callToActionButton}
				onPress={() => videoConfJoin(blockId)}
				android_ripple={{ color: colors.buttonBackgroundPrimaryPress }}
				disableOpacityOnAndroid
				disableOpeningMessageModal>
				<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
			</PressableOpacity>
			<CallParticipants users={users} />
		</VideoConferenceBaseContainer>
	);
}

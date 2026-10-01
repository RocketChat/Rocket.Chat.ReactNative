import { type ReactElement } from 'react';
import { Text } from 'react-native';

import i18n from '~/i18n';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { useIsInPexipCall } from '~/lib/services/videoConf/usePexipCallStore';
import { CallParticipants, type TCallUsers } from './CallParticipants';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';
import Touch from '~/containers/Touch';

export default function VideoConferenceOutgoing({
	users,
	blockId,
	rid
}: {
	users: TCallUsers;
	blockId: string;
	rid: string;
}): ReactElement {
	const style = useStyle();
	const isInPexipCall = useIsInPexipCall();

	return (
		<VideoConferenceBaseContainer variant='outgoing'>
			<Touch
				style={[style.callToActionButton, isInPexipCall && { opacity: 0.5 }]}
				disabled={isInPexipCall}
				onPress={() => videoConfJoin(blockId, { rid })}>
				<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
			</Touch>
			{users.length ? <CallParticipants users={users} /> : null}
		</VideoConferenceBaseContainer>
	);
}

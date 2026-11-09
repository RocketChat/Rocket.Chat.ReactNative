import { type ReactElement } from 'react';
import { Text } from 'react-native';

import i18n from '~/i18n';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { useIsInAnyCall } from '~/lib/services/isInAnyCall';
import { usePexipCallStore } from '~/lib/services/videoConf/usePexipCallStore';
import { CallParticipants, type TCallUsers } from './CallParticipants';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';
import Touch from '~/containers/Touch';

export default function VideoConferenceOutgoing({
	users,
	blockId,
	rid,
	discussionRid
}: {
	users: TCallUsers;
	blockId: string;
	rid: string;
	discussionRid?: string;
}): ReactElement {
	const style = useStyle();
	const isInAnyCall = useIsInAnyCall();
	const isInThisCall = usePexipCallStore(state => state.call?.callId === blockId);
	const isBusy = isInAnyCall && !isInThisCall;

	return (
		<VideoConferenceBaseContainer variant='outgoing' discussionRid={discussionRid}>
			<Touch
				style={[style.callToActionButton, isBusy && { opacity: 0.5 }]}
				disabled={isBusy}
				onPress={() => videoConfJoin(blockId, undefined, undefined, { rid })}>
				<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
			</Touch>
			{users.length ? <CallParticipants users={users} /> : null}
		</VideoConferenceBaseContainer>
	);
}

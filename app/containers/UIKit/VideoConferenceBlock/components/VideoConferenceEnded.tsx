import { type ReactElement } from 'react';
import { Text } from 'react-native';

import { type IUser } from '../../../../definitions';
import { type VideoConferenceType } from '../../../../definitions/IVideoConference';
import i18n from '../../../../i18n';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { useVideoConf } from '../../../../lib/hooks/useVideoConf';
import { useIsInActiveVoipCall } from '../../../../lib/services/voip/isInActiveVoipCall';
import { CallParticipants, type TCallUsers } from './CallParticipants';
import styles from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';
import Touch from '../../../Touch';

export default function VideoConferenceEnded({
	users,
	type,
	createdBy,
	rid
}: {
	users: TCallUsers;
	type: VideoConferenceType;
	createdBy: Pick<IUser, '_id' | 'username' | 'name'>;
	rid: string;
}): ReactElement {
	const username = useAppSelector(state => state.login.user.username);
	const { showInitCallActionSheet } = useVideoConf(rid);
	const isInActiveVoipCall = useIsInActiveVoipCall();

	const onlyAuthorOnCall = users.length === 1 && users.some(user => user.username === createdBy.username);

	return (
		<VideoConferenceBaseContainer variant='ended'>
			{type === 'direct' ? (
				<>
					<Touch style={styles.callToActionCallBack} onPress={showInitCallActionSheet} disabled={isInActiveVoipCall}>
						<Text style={styles.callToActionCallBackText}>
							{createdBy.username === username ? i18n.t('Call_again') : i18n.t('Call_back')}
						</Text>
					</Touch>
					<Text style={styles.callBack}>{i18n.t('Call_was_not_answered')}</Text>
				</>
			) : (
				<>
					{users.length && !onlyAuthorOnCall ? (
						<CallParticipants users={users} />
					) : (
						<Text style={styles.notAnswered}>{i18n.t('Call_was_not_answered')}</Text>
					)}
				</>
			)}
		</VideoConferenceBaseContainer>
	);
}

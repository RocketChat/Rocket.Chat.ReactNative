import { type ReactElement } from 'react';
import { Text } from 'react-native';

import { type IUser } from '~/definitions';
import { type VideoConferenceStatus, type VideoConferenceType } from '~/definitions/IVideoConference';
import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useVideoConf } from '~/lib/hooks/useVideoConf';
import { useIsInActiveVoipCall } from '~/lib/services/voip/isInActiveVoipCall';
import { CallParticipants, type TCallUsers } from './CallParticipants';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';
import Touch from '~/containers/Touch';

export default function VideoConferenceEnded({
	users,
	type,
	createdBy,
	rid,
	status
}: {
	users: TCallUsers;
	type: VideoConferenceType;
	createdBy: Pick<IUser, '_id' | 'username' | 'name'>;
	rid: string;
	status: VideoConferenceStatus;
}): ReactElement {
	const style = useStyle();
	const username = useAppSelector(state => state.login.user.username);
	const { showInitCallActionSheet } = useVideoConf(rid);
	const isInActiveVoipCall = useIsInActiveVoipCall();

	// VideoConferenceStatus is a declare enum: EXPIRED = 2, DECLINED = 4
	const notAnswered = status === 2 || status === 4;

	return (
		<VideoConferenceBaseContainer variant='ended'>
			{type === 'direct' ? (
				<>
					<Touch style={style.callToActionCallBack} onPress={showInitCallActionSheet} disabled={isInActiveVoipCall}>
						<Text style={style.callToActionCallBackText}>
							{createdBy.username === username ? i18n.t('Call_again') : i18n.t('Call_back')}
						</Text>
					</Touch>
					{notAnswered ? <Text style={style.callBack}>{i18n.t('Call_was_not_answered')}</Text> : null}
				</>
			) : (
				<>
					{users.length ? (
						<CallParticipants users={users} />
					) : notAnswered ? (
						<Text style={style.notAnswered}>{i18n.t('Call_was_not_answered')}</Text>
					) : null}
				</>
			)}
		</VideoConferenceBaseContainer>
	);
}

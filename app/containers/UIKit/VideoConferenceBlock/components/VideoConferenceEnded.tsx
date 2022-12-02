import React from 'react';
import { Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { IUser } from '../../../../definitions';
import { VideoConferenceType } from '../../../../definitions/IVideoConference';
import i18n from '../../../../i18n';
import { useAppSelector } from '../../../../lib/hooks';
import { useSnaps } from '../../../../lib/hooks/useSnaps';
import { useActionSheet } from '../../../ActionSheet';
import CallAgainActionSheet from './CallAgainActionSheet';
import { CallParticipants, TCallUsers } from './CallParticipants';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';

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
}): React.ReactElement {
	const style = useStyle();
	const username = useAppSelector(state => state.login.user.username);
	const { showActionSheet } = useActionSheet();
	const snaps = useSnaps([1250]);

	const onlyAuthorOnCall = users.length === 1 && users.some(user => user.username === createdBy.username);

	return (
		<VideoConferenceBaseContainer variant='ended'>
			{type === 'direct' ? (
				<>
					<Touchable
						style={style.callToActionCallBack}
						onPress={() =>
							showActionSheet({
								children: <CallAgainActionSheet rid={rid} />,
								snaps
							})
						}
					>
						<Text style={style.callToActionCallBackText}>
							{createdBy.username === username ? i18n.t('Call_back') : i18n.t('Call_again')}
						</Text>
					</Touchable>
					<Text style={style.callBack}>{i18n.t('Call_was_not_answered')}</Text>
				</>
			) : (
				<>
					{users.length && !onlyAuthorOnCall ? (
						<CallParticipants users={users} />
					) : (
						<Text style={style.notAnswered}>{i18n.t('Call_was_not_answered')}</Text>
					)}
				</>
			)}
		</VideoConferenceBaseContainer>
	);
}

import React from 'react';
import { Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import i18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks';
import { useEndpointData } from '../../../lib/hooks/useEndpointData';
import { useSnaps } from '../../../lib/hooks/useSnaps';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import { useActionSheet } from '../../ActionSheet';
import CallAgainActionSheet from './CallAgainActionSheet';
import { CallParticipants } from './CallParticipants';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';
import VideoConferenceSkeletonLoading from './VideoConferenceSkeletonLoading';

export default function VideoConferenceBlock({ callId, blockId }: { callId: string; blockId?: string }): React.ReactElement {
	const style = useStyle();
	const { joinCall } = useVideoConf();
	const username = useAppSelector(state => state.login.user.username);
	const { showActionSheet } = useActionSheet();

	const { loading, result } = useEndpointData('video-conference.info', { callId });

	const snaps = useSnaps([1250]);

	if (loading) return <VideoConferenceSkeletonLoading />;

	if (result?.success) {
		const { users, type, status, createdBy } = result;
		const onlyAuthorOnCall = users.length === 1 && users.some(user => user.username === createdBy.username);

		if ('endedAt' in result) {
			return (
				<VideoConferenceBaseContainer variant='ended'>
					{type === 'direct' ? (
						<>
							<Touchable
								style={style.callToActionCallBack}
								onPress={() =>
									showActionSheet({
										children: <CallAgainActionSheet rid={result.rid} />,
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

		if (type === 'direct' && status === 0) {
			return (
				<VideoConferenceBaseContainer variant='incoming'>
					<Touchable style={style.callToActionButton}>
						<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
					</Touchable>
					<Text style={style.callBack}>{i18n.t('Waiting_for_answer')}</Text>
				</VideoConferenceBaseContainer>
			);
		}

		return (
			<VideoConferenceBaseContainer variant='outgoing'>
				<Touchable style={style.callToActionButton} onPress={() => blockId && joinCall(blockId)}>
					<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
				</Touchable>
				<CallParticipants users={users} />
			</VideoConferenceBaseContainer>
		);
	}

	return <VideoConferenceSkeletonLoading />;
}

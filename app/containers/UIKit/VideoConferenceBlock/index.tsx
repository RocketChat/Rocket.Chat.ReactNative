import React from 'react';
import { Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import i18n from '../../../i18n';
import { useEndpointData } from '../../../lib/hooks/useEndpointData';
import { CallParticipants } from './CallParticipants';
import { useVideoConf } from './hooks';
import useStyle from './styles';
import { VideoConferenceBaseContainer } from './VideoConferenceBaseContainer';
import VideoConferenceSkeletonLoading from './VideoConferenceSkeletonLoading';

export default function VideoConferenceBlock({ callId, blockId }: { callId: string; blockId?: string }): React.ReactElement {
	const style = useStyle();
	const { loading, result } = useEndpointData('video-conference.info', { callId });
	const { joinCall } = useVideoConf();

	if (loading) return <VideoConferenceSkeletonLoading />;

	if (result?.success) {
		const { users, type, status } = result;
		if ('endedAt' in result) {
			return (
				<VideoConferenceBaseContainer variant='ended'>
					{type === 'direct' ? (
						<>
							<Touchable style={style.callToActionCallBack}>
								<Text style={style.callToActionCallBackText}>{i18n.t('Call_back')}</Text>
							</Touchable>
							<Text style={style.callBack}>{i18n.t('Call_was_not_answered')}</Text>
						</>
					) : (
						<>
							{users.length ? (
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

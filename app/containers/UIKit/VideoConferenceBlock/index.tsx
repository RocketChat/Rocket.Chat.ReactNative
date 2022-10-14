import React from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import i18n from '../../../i18n';
import { useEndpointData } from '../../../lib/hooks/useEndpointData';
import VideoConferenceSkeletonLoading from './VideoConferenceSkeletonLoading';
import useStyle from './styles';
import { VideoConfIcon } from './VideoConfIcon';
import { CallParticipants } from './CallParticipants';

export default function VideoConferenceBlock({ callId }: { callId: string }): React.ReactElement {
	const style = useStyle();
	const { loading, result } = useEndpointData('video-conference.info', { callId });

	if (loading) return <VideoConferenceSkeletonLoading />;

	if (result?.success) {
		const { users, type, status } = result;
		if (result?.success && 'endedAt' in result) {
			return (
				<View style={style.container}>
					<View style={style.callInfoContainer}>
						<VideoConfIcon variant='ended' />
						<Text style={style.infoContainerText}>{i18n.t('Call_ended')}</Text>
					</View>
					<View style={style.callToActionContainer}>
						{type === 'direct' && (
							<>
								<Touchable style={style.callToActionCallBack}>
									<Text style={style.callToActionCallBackText}>{i18n.t('Call_back')}</Text>
								</Touchable>
								<Text style={style.callBack}>{i18n.t('Call_was_not_answered')}</Text>
							</>
						)}
						{type !== 'direct' ? (
							<>
								{users.length ? (
									<CallParticipants users={users} />
								) : (
									<Text style={style.notAnswered}>{i18n.t('Call_was_not_answered')}</Text>
								)}
							</>
						) : null}
					</View>
				</View>
			);
		}

		if (type === 'direct' && status === 0) {
			return (
				<View style={style.container}>
					<View style={style.callInfoContainer}>
						<VideoConfIcon variant='incoming' />
						<Text style={style.infoContainerText}>{i18n.t('Calling')}</Text>
					</View>
					<View style={style.callToActionContainer}>
						<Touchable style={style.callToActionButton}>
							<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
						</Touchable>
						<Text style={style.callBack}>{i18n.t('Waiting_for_answer')}</Text>
					</View>
				</View>
			);
		}

		return (
			<View style={style.container}>
				<View style={style.callInfoContainer}>
					<VideoConfIcon variant='outgoing' />
					<Text style={style.infoContainerText}>{i18n.t('Call_ongoing')}</Text>
				</View>
				<View style={style.callToActionContainer}>
					<Touchable style={style.callToActionButton}>
						<Text style={style.callToActionButtonText}>{i18n.t('Join')}</Text>
					</Touchable>
					<CallParticipants users={users} />
				</View>
			</View>
		);
	}

	return <VideoConferenceSkeletonLoading />;
}

import { type ReactElement } from 'react';

import { VideoConferenceStatus } from '~/definitions/IVideoConference';
import VideoConferenceDirect from './components/VideoConferenceDirect';
import VideoConferenceEnded from './components/VideoConferenceEnded';
import VideoConferenceOutgoing from './components/VideoConferenceOutgoing';
import VideoConferenceSkeletonLoading from './components/VideoConferenceSkeletonLoading';
import VideoConferenceIssue from './components/VideoConferenceIssue';
import { useVideoConferenceInfo } from './useVideoConferenceInfo';

export default function VideoConferenceBlock({ callId, blockId }: { callId: string; blockId: string }): ReactElement {
	const { result, error, participants } = useVideoConferenceInfo(callId);

	if (result?.success) {
		const { type, status, createdBy, rid, discussionRid } = result;

		if ('endedAt' in result) {
			return (
				<VideoConferenceEnded
					createdBy={createdBy}
					rid={rid}
					type={type}
					status={status}
					users={participants}
					discussionRid={discussionRid}
				/>
			);
		}

		if (type === 'direct' && status === VideoConferenceStatus.CALLING)
			return <VideoConferenceDirect discussionRid={discussionRid} />;

		return <VideoConferenceOutgoing blockId={blockId} rid={rid} users={participants} discussionRid={discussionRid} />;
	}

	if (result?.error || error) return <VideoConferenceIssue />;

	return <VideoConferenceSkeletonLoading />;
}

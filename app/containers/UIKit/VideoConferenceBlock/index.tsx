import React from 'react';

import { useEndpointData } from '../../../lib/hooks/useEndpointData';
import VideoConferenceDirect from './components/VideoConferenceDirect';
import VideoConferenceEnded from './components/VideoConferenceEnded';
import VideoConferenceOutgoing from './components/VideoConferenceOutgoing';
import VideoConferenceSkeletonLoading from './components/VideoConferenceSkeletonLoading';
import VideoConferenceIssue from './components/VideoConferenceIssue';

export default function VideoConferenceBlock({ callId, blockId }: { callId: string; blockId: string }): React.ReactElement {
	const { result, error } = useEndpointData('video-conference.info', { callId });

	if (result?.success) {
		const { users, type, status, createdBy, rid } = result;

		if ('endedAt' in result) return <VideoConferenceEnded createdBy={createdBy} rid={rid} type={type} users={users} />;

		if (type === 'direct' && status === 0) return <VideoConferenceDirect />;

		return <VideoConferenceOutgoing blockId={blockId} users={users} />;
	}

	if (result?.error || error) return <VideoConferenceIssue />;

	return <VideoConferenceSkeletonLoading />;
}

import { useEffect, type ReactElement } from 'react';

import { useEndpointData } from '~/lib/hooks/useEndpointData';
import { emitter } from '~/lib/methods/helpers/emitter';
import VideoConferenceDirect from './components/VideoConferenceDirect';
import VideoConferenceEnded from './components/VideoConferenceEnded';
import VideoConferenceOutgoing from './components/VideoConferenceOutgoing';
import VideoConferenceSkeletonLoading from './components/VideoConferenceSkeletonLoading';
import VideoConferenceIssue from './components/VideoConferenceIssue';

export default function VideoConferenceBlock({ callId, blockId }: { callId: string; blockId: string }): ReactElement {
	const { result, error, reload } = useEndpointData('video-conference.info', { callId });

	useEffect(() => {
		const onUpdate = ({ callId: updatedCallId }: { callId: string }) => {
			if (updatedCallId === callId) {
				reload();
			}
		};
		emitter.on('videoConfUpdated', onUpdate);
		return () => emitter.off('videoConfUpdated', onUpdate);
	}, [callId, reload]);

	if (result?.success) {
		const { users, type, status, createdBy, rid, discussionRid } = result;

		if ('endedAt' in result) {
			return (
				<VideoConferenceEnded
					createdBy={createdBy}
					rid={rid}
					type={type}
					status={status}
					users={users}
					discussionRid={discussionRid}
				/>
			);
		}

		if (type === 'direct' && status === 0) return <VideoConferenceDirect discussionRid={discussionRid} />;

		return <VideoConferenceOutgoing blockId={blockId} users={users} discussionRid={discussionRid} />;
	}

	if (result?.error || error) return <VideoConferenceIssue />;

	return <VideoConferenceSkeletonLoading />;
}

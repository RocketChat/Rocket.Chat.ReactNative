import { isTrackReference, useParticipants, useSpeakingParticipants, useTracks } from '@livekit/react-native';
import type { TrackPublication } from 'livekit-client';

import { isAgentParticipant } from '~/lib/methods/helpers/isAgentParticipant';
import type { ScreenShare } from '~/lib/methods/helpers/pickFeaturedScreen';
import { Track } from '~/lib/services/conference/livekit';
import type { IStageTile } from './ConferenceStage';

export type TTrackRef = ReturnType<typeof useTracks>[number];

export interface IConferenceTile extends IStageTile {
	name: string;
	muted: boolean;
	isSelf: boolean;
	cameraTrack?: TTrackRef;
	micTrack?: TTrackRef;
}

export type TConferenceScreenShare = ScreenShare<TrackPublication> & { trackRef: TTrackRef };

const hasLiveVideo = (track?: TTrackRef): boolean =>
	!!track && isTrackReference(track) && !track.publication.isMuted && !!track.publication.track;

const isMicMuted = (track?: TTrackRef): boolean => !(track && isTrackReference(track) && !track.publication.isMuted);

export const useConferenceTiles = () => {
	const participants = useParticipants();
	const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
	const micTracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: true }]);
	const screenTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);
	const speakers = useSpeakingParticipants();

	const people = participants.filter(({ identity, isAgent }) => !isAgentParticipant({ identity, isAgent }));

	const tiles: IConferenceTile[] = people.map(participant => {
		const cameraTrack = cameraTracks.find(({ participant: owner }) => owner.identity === participant.identity);
		const micTrack = micTracks.find(({ participant: owner }) => owner.identity === participant.identity);
		return {
			id: participant.identity,
			name: participant.name || participant.identity,
			hasCamera: hasLiveVideo(cameraTrack),
			muted: isMicMuted(micTrack),
			isSelf: participant.isLocal,
			cameraTrack,
			micTrack
		};
	});

	const shares: TConferenceScreenShare[] = screenTracks.flatMap(trackRef =>
		isTrackReference(trackRef) &&
		trackRef.publication.track &&
		!isAgentParticipant({ identity: trackRef.participant.identity, isAgent: trackRef.participant.isAgent })
			? [
					{
						id: trackRef.participant.identity,
						stream: trackRef.publication,
						name: trackRef.participant.name || trackRef.participant.identity,
						isLocal: trackRef.participant.isLocal,
						trackRef
					}
				]
			: []
	);

	return { tiles, shares, speakers };
};

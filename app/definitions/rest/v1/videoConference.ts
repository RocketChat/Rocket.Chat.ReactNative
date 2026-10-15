import {
	type VideoConfAddParticipantsProps,
	type VideoConfCall,
	type VideoConfCallIdProps,
	type VideoConfCancelProps,
	type VideoConference,
	type VideoConferenceCallConfig,
	type VideoConferenceCapabilities,
	type VideoConferenceInstructions,
	type VideoConfInfoProps,
	type VideoConfJoinProps,
	type VideoConfListProps,
	type VideoConfRingProps,
	type VideoConfStartProps
} from '~/definitions/IVideoConference';
import { type PaginatedResult } from '../helpers/PaginatedResult';

export type VideoConferenceEndpoints = {
	'video-conference.start': {
		POST: (params: VideoConfStartProps) => { data: VideoConferenceInstructions & { providerName: string } };
	};

	'video-conference.join': {
		POST: (params: VideoConfJoinProps) => { url: string; providerName: string; callId?: string; rid?: string };
	};

	'video-conference.cancel': {
		POST: (params: VideoConfCancelProps) => void;
	};

	'video-conference.leave': {
		POST: (params: VideoConfCallIdProps) => void;
	};

	'video-conference.heartbeat': {
		POST: (params: VideoConfCallIdProps) => void;
	};

	'video-conference.decline': {
		POST: (params: VideoConfCallIdProps) => void;
	};

	'video-conference.callConfig': {
		GET: (params: VideoConfCallIdProps) => VideoConferenceCallConfig;
	};

	'video-conference.info': {
		GET: (params: VideoConfInfoProps) => VideoConfCall;
	};

	'video-conference.add-participants': {
		POST: (params: VideoConfAddParticipantsProps) => { added: string[] };
	};

	'video-conference.ring': {
		POST: (params: VideoConfRingProps) => { rang: boolean };
	};

	'video-conference.list': {
		GET: (params: VideoConfListProps) => PaginatedResult<{ data: VideoConference[] }>;
	};

	'video-conference.capabilities': {
		GET: () => { providerName: string; capabilities: VideoConferenceCapabilities };
	};

	'video-conference.providers': {
		GET: () => { data: { key: string; label: string }[] };
	};

	'video-conference/jitsi.update-timeout': {
		POST: (params: { roomId: string }) => void;
	};
};

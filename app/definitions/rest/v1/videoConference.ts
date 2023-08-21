import {
	VideoConfCall,
	VideoConfCancelProps,
	VideoConference,
	VideoConferenceCapabilities,
	VideoConferenceInstructions,
	VideoConfInfoProps,
	VideoConfJoinProps,
	VideoConfListProps,
	VideoConfStartProps
} from '../../IVideoConference';
import { PaginatedResult } from '../helpers/PaginatedResult';

export type VideoConferenceEndpoints = {
	'video-conference.start': {
		POST: (params: VideoConfStartProps) => { data: VideoConferenceInstructions & { providerName: string } };
	};

	'video-conference.join': {
		POST: (params: VideoConfJoinProps) => { url: string; providerName: string };
	};

	'video-conference.cancel': {
		POST: (params: VideoConfCancelProps) => void;
	};

	'video-conference.info': {
		GET: (params: VideoConfInfoProps) => VideoConfCall;
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

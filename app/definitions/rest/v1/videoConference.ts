import { VideoConference } from '../../IVideoConference';

export type VideoConferenceEndpoints = {
	'video-conference/jitsi.update-timeout': {
		POST: (params: { roomId: string }) => void;
	};
	'video-conference.join': {
		POST: (params: { callId: string; state: { cam: boolean } }) => { url: string; providerName: string };
	};
	'video-conference.start': {
		POST: (params: { roomId: string }) => { url: string };
	};

	'video-conference.cancel': {
		POST: (params: { callId: string }) => void;
	};

	'video-conference.info': {
		GET: (params: { callId: string }) => VideoConference & {
			capabilities: {
				mic?: boolean;
				cam?: boolean;
				title?: boolean;
			};
		};
	};
};

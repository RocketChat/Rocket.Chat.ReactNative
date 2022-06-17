export type VideoConferenceEndpoints = {
	'video-conference/jitsi.update-timeout': {
		POST: (params: { roomId: string }) => void;
	};
	'video-conference.join': {
		POST: (params: { callId: string }) => { url: string };
	};
};

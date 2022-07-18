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
};

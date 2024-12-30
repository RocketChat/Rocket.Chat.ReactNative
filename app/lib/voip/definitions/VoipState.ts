export type VoipState = {
	isRegistered: boolean;
	isReady: boolean;
	isOnline: boolean;
	isIncoming: boolean;
	isOngoing: boolean;
	isOutgoing: boolean;
	isInCall: boolean;
	isError: boolean;
	error?: Error | null;
	clientError?: Error | null;
};

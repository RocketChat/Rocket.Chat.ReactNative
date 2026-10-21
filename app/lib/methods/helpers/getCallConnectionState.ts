export type TCallConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export const getCallConnectionState = (state: string): TCallConnectionState => {
	switch (state) {
		case 'connected':
			return 'connected';
		case 'connecting':
			return 'connecting';
		case 'reconnecting':
		case 'signalReconnecting':
			return 'reconnecting';
		default:
			return 'disconnected';
	}
};

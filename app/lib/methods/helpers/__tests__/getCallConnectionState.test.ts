import { getCallConnectionState } from '../getCallConnectionState';

describe('getCallConnectionState', () => {
	it('calls a dropped signal connection reconnecting, like a dropped media connection', () => {
		expect(getCallConnectionState('signalReconnecting')).toBe('reconnecting');
	});

	it('treats an unknown state as disconnected rather than connected', () => {
		expect(getCallConnectionState('resuming')).toBe('disconnected');
	});
});

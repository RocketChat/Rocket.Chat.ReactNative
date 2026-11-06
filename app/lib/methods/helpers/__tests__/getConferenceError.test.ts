import { getConferenceError } from '../getConferenceError';

const rejection = (error: unknown) => ({ data: { success: false, error } });

describe('getConferenceError', () => {
	it.each([
		['error-videoconf-livekit-not-licensed', 'not-licensed'],
		['error-videoconf-livekit-not-configured', 'not-configured'],
		['error-videoconf-livekit-token-failed', 'token-failed'],
		['error-videoconf-invalid-call', 'ended']
	])('reads the server error %s as %s', (code, expected) => {
		expect(getConferenceError(rejection(code), 'join-failed')).toBe(expected);
	});

	it('falls back for an error the server did not name', () => {
		expect(getConferenceError(rejection('error-something-else'), 'join-failed')).toBe('join-failed');
	});

	it('falls back when the failure carried no server body, as a dropped connection does', () => {
		expect(getConferenceError(new Error('Network request failed'), 'join-failed')).toBe('join-failed');
		expect(getConferenceError(undefined, 'token-failed')).toBe('token-failed');
		expect(getConferenceError(rejection(404), 'join-failed')).toBe('join-failed');
	});
});

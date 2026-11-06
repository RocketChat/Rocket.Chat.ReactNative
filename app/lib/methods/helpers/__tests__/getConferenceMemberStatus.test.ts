import { getConferenceMemberStatus } from '../getConferenceMemberStatus';
import { RINGING_WINDOW_MS } from '../groupConferenceMembers';

const NOW = Date.parse('2026-10-15T08:00:00.000Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe('getConferenceMemberStatus', () => {
	it('is joined for someone in the call, even when they were rung', () => {
		expect(getConferenceMemberStatus({ joined: true, ringingAt: ago(1000) }, NOW)).toBe('joined');
	});

	it('is ringing while the phone is still ringing', () => {
		expect(getConferenceMemberStatus({ joined: false, ringingAt: ago(1000) }, NOW)).toBe('ringing');
	});

	it('is invited once the ring ran out without an answer', () => {
		expect(getConferenceMemberStatus({ joined: false, ringingAt: ago(RINGING_WINDOW_MS + 1000) }, NOW)).toBe('invited');
	});

	it('is invited for someone who was added and never rung', () => {
		expect(getConferenceMemberStatus({ joined: false }, NOW)).toBe('invited');
	});

	it('is declined for someone who turned the call down', () => {
		expect(getConferenceMemberStatus({ joined: false, declined: true, declinedAt: ago(5000) }, NOW)).toBe('declined');
	});

	it('is left for someone who hung up, which is the last thing that happened to them', () => {
		expect(getConferenceMemberStatus({ joined: true, leftAt: ago(5000) }, NOW)).toBe('left');
	});

	it('is left before declined when they did both', () => {
		expect(getConferenceMemberStatus({ declined: true, leftAt: ago(5000) }, NOW)).toBe('left');
	});

	it('is ringing again after a decline when they are rung a second time', () => {
		expect(getConferenceMemberStatus({ joined: false, declined: true, declinedAt: ago(20_000), ringingAt: ago(1000) }, NOW)).toBe(
			'ringing'
		);
	});
});

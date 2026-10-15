import { isInVideoConference } from '../isInVideoConference';

describe('isInVideoConference', () => {
	it('is true for someone who joined and has not left', () => {
		expect(isInVideoConference({ joined: true })).toBe(true);
	});

	it('reads an entry without the joined flag as joined', () => {
		expect(isInVideoConference({})).toBe(true);
	});

	it('is false once they left, even though joined never goes back to false', () => {
		expect(isInVideoConference({ joined: true, leftAt: new Date() })).toBe(false);
	});

	it('is false for a member who never joined', () => {
		expect(isInVideoConference({ joined: false })).toBe(false);
	});
});

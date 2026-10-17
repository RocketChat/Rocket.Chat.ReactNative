import { hasConferenceChatAccess } from '../hasConferenceChatAccess';

describe('hasConferenceChatAccess', () => {
	it('is true for somebody who can read the chat', () => {
		expect(hasConferenceChatAccess(['ada'], 'me')).toBe(true);
	});

	it('is false for somebody the server lists as unable to read it', () => {
		expect(hasConferenceChatAccess(['ada', 'me'], 'me')).toBe(false);
	});

	it('is true when nobody is without access', () => {
		expect(hasConferenceChatAccess([], 'me')).toBe(true);
	});

	it('does not block anybody while the viewer is not known yet', () => {
		expect(hasConferenceChatAccess(['ada'], undefined)).toBe(true);
	});
});

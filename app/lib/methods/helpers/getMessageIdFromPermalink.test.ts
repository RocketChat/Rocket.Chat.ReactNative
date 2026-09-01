import { getMessageIdFromPermalink } from './getMessageIdFromPermalink';

describe('getMessageIdFromPermalink', () => {
	it('extracts the message id from a channel permalink', () => {
		expect(getMessageIdFromPermalink('https://mobile.qa.rocket.chat/channel/general?msg=n5WaK5NRJN42Hg26w')).toBe(
			'n5WaK5NRJN42Hg26w'
		);
	});

	it('extracts the message id from a private group permalink', () => {
		expect(getMessageIdFromPermalink('https://mobile.qa.rocket.chat/group/channel-etc?msg=cIqhbvkOSgiCOK4Wh')).toBe(
			'cIqhbvkOSgiCOK4Wh'
		);
	});

	it('extracts the message id when other query params follow', () => {
		expect(getMessageIdFromPermalink('https://server.com/channel/general?msg=abc123&jump=1')).toBe('abc123');
	});

	it('extracts the message id when other query params precede it', () => {
		expect(getMessageIdFromPermalink('https://server.com/channel/general?jump=1&msg=abc123')).toBe('abc123');
	});

	it('returns undefined when there is no msg param', () => {
		expect(getMessageIdFromPermalink('https://server.com/channel/general')).toBeUndefined();
	});

	it('does not match a param merely ending in msg', () => {
		expect(getMessageIdFromPermalink('https://server.com/channel/general?tmsg=abc123')).toBeUndefined();
	});

	it('returns undefined for an empty msg param', () => {
		expect(getMessageIdFromPermalink('https://server.com/channel/general?msg=')).toBeUndefined();
	});

	it('returns undefined for missing input', () => {
		expect(getMessageIdFromPermalink(undefined)).toBeUndefined();
		expect(getMessageIdFromPermalink('')).toBeUndefined();
	});
});

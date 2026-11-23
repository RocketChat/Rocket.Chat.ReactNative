import { parseMessage } from '../parseMessage';

describe('parseMessage', () => {
	it('parses the same text again when the emoticons option changes', () => {
		const withoutEmoticons = parseMessage('hi :)', {});
		const withEmoticons = parseMessage('hi :)', { emoticons: true });
		expect(JSON.stringify(withoutEmoticons)).not.toContain('EMOJI');
		expect(JSON.stringify(withEmoticons)).toContain('EMOJI');
	});

	it('parses the same text again when the custom domains change', () => {
		const withoutDomain = parseMessage('see intranet.local', {});
		const withDomain = parseMessage('see intranet.local', { customDomains: ['intranet.local'] });
		expect(JSON.stringify(withoutDomain)).not.toContain('LINK');
		expect(JSON.stringify(withDomain)).toContain('LINK');
	});
});

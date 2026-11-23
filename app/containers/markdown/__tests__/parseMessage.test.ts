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

	it('keeps a recently read message cached while older ones are evicted', () => {
		let parseWithFreshCache: typeof parseMessage = parseMessage;
		jest.isolateModules(() => {
			parseWithFreshCache = jest.requireActual<typeof import('../parseMessage')>('../parseMessage').parseMessage;
		});
		const first = parseWithFreshCache('lru first', {});
		const second = parseWithFreshCache('lru second', {});
		Array.from({ length: 198 }, (_, index) => parseWithFreshCache(`lru filler ${index}`, {}));

		expect(parseWithFreshCache('lru first', {})).toBe(first);
		parseWithFreshCache('lru overflow', {});

		expect(parseWithFreshCache('lru first', {})).toBe(first);
		expect(parseWithFreshCache('lru second', {})).not.toBe(second);
	});
});

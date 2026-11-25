import { type Options } from '@rocket.chat/message-parser';

import { parseOffThread } from '../parseOffThread';

jest.mock('../parseOffThread', () => ({
	parseOffThread: jest.fn()
}));

const parseOffThreadMock = jest.mocked(parseOffThread);

const loadFreshStore = (): typeof import('../parseMessage') => {
	let store: typeof import('../parseMessage') | undefined;
	jest.isolateModules(() => {
		store = jest.requireActual<typeof import('../parseMessage')>('../parseMessage');
	});
	return store!;
};

const finishParse = (callIndex: number) => {
	const [msg, options, onParsed] = parseOffThreadMock.mock.calls[callIndex];
	onParsed(jest.requireActual<typeof import('@rocket.chat/message-parser')>('@rocket.chat/message-parser').parse(msg, options));
};

beforeEach(() => {
	parseOffThreadMock.mockReset();
});

describe('subscribeToParsedRoot', () => {
	it('parses off the JS thread once and notifies every subscriber of that message', () => {
		const store = loadFreshStore();
		const first = jest.fn();
		const second = jest.fn();

		store.subscribeToParsedRoot('**hi**', {}, first);
		store.subscribeToParsedRoot('**hi**', {}, second);
		expect(store.getParsedRoot(store.parseCacheKey('**hi**', {}))).toBeUndefined();

		finishParse(0);

		expect(parseOffThreadMock).toHaveBeenCalledTimes(1);
		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
		expect(store.getParsedRoot(store.parseCacheKey('**hi**', {}))?.[0].type).toBe('PARAGRAPH');
	});

	it('does not parse again when a message remounts while its parse is in flight', () => {
		const store = loadFreshStore();

		const unsubscribe = store.subscribeToParsedRoot('remount', {}, jest.fn());
		unsubscribe();
		store.subscribeToParsedRoot('remount', {}, jest.fn());

		expect(parseOffThreadMock).toHaveBeenCalledTimes(1);
	});

	it('parses the same text again when the parse options change', () => {
		const store = loadFreshStore();
		const emoticons: Options = { emoticons: true };

		store.subscribeToParsedRoot('hi :)', {}, jest.fn());
		store.subscribeToParsedRoot('hi :)', emoticons, jest.fn());
		finishParse(0);
		finishParse(1);

		expect(JSON.stringify(store.getParsedRoot(store.parseCacheKey('hi :)', {})))).not.toContain('EMOJI');
		expect(JSON.stringify(store.getParsedRoot(store.parseCacheKey('hi :)', emoticons)))).toContain('EMOJI');
	});

	it('shows the text as plain paragraphs when the parse fails', () => {
		const store = loadFreshStore();
		parseOffThreadMock.mockImplementation((_msg, _options, onParsed) => onParsed(null));

		store.subscribeToParsedRoot('**a**\nb', {}, jest.fn());

		expect(store.getParsedRoot(store.parseCacheKey('**a**\nb', {}))).toEqual([
			{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '**a**' }] },
			{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'b' }] }
		]);
	});

	it('keeps a recently shown message cached while older ones are evicted', () => {
		const store = loadFreshStore();
		parseOffThreadMock.mockImplementation((msg, options, onParsed) =>
			onParsed(
				jest.requireActual<typeof import('@rocket.chat/message-parser')>('@rocket.chat/message-parser').parse(msg, options)
			)
		);
		const show = (msg: string) => store.subscribeToParsedRoot(msg, {}, jest.fn())();
		const cached = (msg: string) => store.getParsedRoot(store.parseCacheKey(msg, {}));

		show('lru first');
		show('lru second');
		Array.from({ length: 198 }, (_, index) => show(`lru filler ${index}`));
		show('lru first');
		show('lru overflow');

		expect(cached('lru first')).toBeDefined();
		expect(cached('lru second')).toBeUndefined();
	});
});

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
		expect(store.getParsedRoot('**hi**', {})).toBeUndefined();

		finishParse(0);

		expect(parseOffThreadMock).toHaveBeenCalledTimes(1);
		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
		expect(store.getParsedRoot('**hi**', {})?.[0].type).toBe('PARAGRAPH');
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

		expect(JSON.stringify(store.getParsedRoot('hi :)', {}))).not.toContain('EMOJI');
		expect(JSON.stringify(store.getParsedRoot('hi :)', emoticons))).toContain('EMOJI');
	});

	it('shows the text as plain paragraphs when the parse fails', () => {
		const store = loadFreshStore();
		parseOffThreadMock.mockImplementation((_msg, _options, onParsed) => onParsed(null));

		store.subscribeToParsedRoot('**a**\nb', {}, jest.fn());

		expect(store.getParsedRoot('**a**\nb', {})).toEqual([
			{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: '**a**' }] },
			{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'b' }] }
		]);
	});

	it('shows plain text right away and notifies the subscriber when the parse fails before it starts', () => {
		const store = loadFreshStore();
		const listener = jest.fn();
		parseOffThreadMock.mockImplementationOnce((_msg, _options, onParsed) => onParsed(null));

		store.subscribeToParsedRoot('no runtime', {}, listener);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(store.getParsedRoot('no runtime', {})).toEqual([
			{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'no runtime' }] }
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
		const cached = (msg: string) => store.getParsedRoot(msg, {});

		show('lru first');
		show('lru second');
		Array.from({ length: 198 }, (_, index) => show(`lru filler ${index}`));
		show('lru first');
		show('lru overflow');

		expect(cached('lru first')).toBeDefined();
		expect(cached('lru second')).toBeUndefined();
	});

	it('keeps the root of a mounted message while 200 other messages store theirs', () => {
		const store = loadFreshStore();
		store.subscribeToParsedRoot('still mounted', {}, jest.fn());
		finishParse(0);
		parseOffThreadMock.mockImplementation((msg, options, onParsed) =>
			onParsed(
				jest.requireActual<typeof import('@rocket.chat/message-parser')>('@rocket.chat/message-parser').parse(msg, options)
			)
		);

		Array.from({ length: 200 }, (_, index) => store.subscribeToParsedRoot(`other ${index}`, {}, jest.fn())());

		expect(store.getParsedRoot('still mounted', {})?.[0].type).toBe('PARAGRAPH');
		expect(store.getParsedRoot('other 0', {})).toBeUndefined();
		expect(store.getParsedRoot('other 199', {})).toBeDefined();
	});
});

describe('getParsedRoot', () => {
	it('shows a message longer than the parse limit as the same plain text root without parsing it', () => {
		const store = loadFreshStore();
		const msg = `**${'a'.repeat(store.MESSAGE_MAX_PARSE_LENGTH)}**`;

		store.subscribeToParsedRoot(msg, {}, jest.fn());
		const root = store.getParsedRoot(msg, {});

		expect(parseOffThreadMock).not.toHaveBeenCalled();
		expect(root).toEqual([{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: msg }] }]);
		expect(store.getParsedRoot(msg, {})).toBe(root);
	});

	it('shows nothing for an empty message without parsing it', () => {
		const store = loadFreshStore();

		store.subscribeToParsedRoot('', {}, jest.fn());

		expect(parseOffThreadMock).not.toHaveBeenCalled();
		expect(store.getParsedRoot('', {})).toEqual([]);
	});
});

import { parse } from '@rocket.chat/message-parser';

import { buildRenderSegments, type ISerializeContext } from './serialize';

const baseContext: ISerializeContext = {
	mentions: [],
	channels: [],
	useRealName: false,
	username: '',
	mentionsWithAtSymbol: false,
	roomsWithHashTagSymbol: false,
	getCustomEmoji: () => null,
	baseUrl: 'https://open.rocket.chat',
	convertAsciiEmoji: true,
	formatShortnameToUnicode: shortname => shortname
};

const serialize = (msg: string, ctx: Partial<ISerializeContext> = {}) => {
	const segments = buildRenderSegments(parse(msg), { ...baseContext, ...ctx });
	return segments
		.map(segment => {
			if (segment.type === 'markdown') return segment.content;
			if (segment.type === 'katex') return `$$${segment.value}$$`;
			return '';
		})
		.join('\n\n');
};

describe('markdown serialize', () => {
	it('escapes plain text so literal punctuation is not reinterpreted as markdown', () => {
		expect(serialize('a * b')).toBe('a \\* b');
	});

	it('serializes bold, italic and strike as CommonMark', () => {
		expect(serialize('*bold* _italic_ ~strike~')).toBe('**bold** _italic_ ~~strike~~');
	});

	it('serializes a known user mention as a user scheme link', () => {
		const result = serialize('@rocket.cat', {
			mentions: [{ _id: 'u1', username: 'rocket.cat', name: 'Rocket Cat', type: 'user' }]
		});
		expect(result).toBe('[rocket\\.cat](<user://u1>)');
	});

	it('marks the mention itsMe with ?me=1', () => {
		const result = serialize('@rocket.cat', {
			username: 'rocket.cat',
			mentions: [{ _id: 'u1', username: 'rocket.cat', name: 'Rocket Cat', type: 'user' }]
		});
		expect(result).toBe('[rocket\\.cat](<user://u1?me=1>)');
	});

	it('marks a team mention with ?team=1', () => {
		const result = serialize('@design-team', {
			mentions: [{ _id: 't1', name: 'design-team', type: 'team' }]
		});
		expect(result).toBe('[design\\-team](<user://t1?team=1>)');
	});

	it('renders an unknown user mention as plain text', () => {
		expect(serialize('@unknown-user')).toBe('@unknown\\-user');
	});

	it('serializes a known channel mention as a channel scheme link', () => {
		const result = serialize('#general', { channels: [{ _id: 'r1', name: 'general' }] });
		expect(result).toBe('[general](<channel://r1>)');
	});

	it('renders an unknown channel mention as plain text', () => {
		expect(serialize('#unknown-channel')).toBe('\\#unknown\\-channel');
	});

	it('keeps http(s) links unchanged', () => {
		expect(serialize('[Rocket.Chat](https://rocket.chat)')).toBe('[Rocket\\.Chat](<https://rocket.chat>)');
	});

	it('serializes a timestamp as a timestamp scheme link', () => {
		const result = serialize('<t:1735689600:d>');
		expect(result).toContain('](<timestamp://1735689600>)');
	});

	describe('custom emoji', () => {
		const getCustomEmoji: ISerializeContext['getCustomEmoji'] = name =>
			name === 'marioparty' ? { name: 'marioparty', extension: 'gif' } : null;
		const marioparty = '\u2060![](https://open.rocket.chat/emoji-custom/marioparty.gif)';

		it('serializes a custom emoji as an image after a word joiner so it renders inline', () => {
			expect(serialize(':marioparty:', { getCustomEmoji })).toBe(marioparty);
		});

		it('joins big emoji without separators', () => {
			expect(serialize(':marioparty: :marioparty: :marioparty:', { getCustomEmoji })).toBe(marioparty.repeat(3));
		});

		it('joins custom and unicode big emoji without separators', () => {
			expect(serialize(':marioparty: 😀', { getCustomEmoji })).toBe(`${marioparty}😀`);
		});

		it('keeps a custom emoji inline within a sentence', () => {
			expect(serialize(':marioparty: hello :marioparty: world', { getCustomEmoji })).toBe(
				`${marioparty} hello ${marioparty} world`
			);
		});
	});

	it('serializes an unordered list', () => {
		expect(serialize('* one\n* two')).toBe('- one\n- two');
	});

	it('serializes a task list with checked state', () => {
		expect(serialize('- [x] done\n- [ ] pending')).toBe('- [x] done\n- [ ] pending');
	});

	it('serializes a fenced code block', () => {
		expect(serialize('```\nconst a = 1;\n```')).toBe('```\nconst a = 1;\n```');
	});

	it('splits a block-level KATEX AST node (as produced by the server-parsed md prop) into a separate katex segment', () => {
		const tokens: Parameters<typeof buildRenderSegments>[0] = [{ type: 'KATEX', value: 'x^2' }];
		const segments = buildRenderSegments(tokens, baseContext);
		expect(segments).toEqual([{ type: 'katex', value: 'x^2' }]);
	});
});

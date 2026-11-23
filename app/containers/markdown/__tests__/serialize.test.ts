import { parse } from '@rocket.chat/message-parser';

import { buildRenderSegments, type ISerializeContext } from '../serialize';

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
			return '';
		})
		.join('\n\n');
};

describe('markdown serialize', () => {
	it('escapes plain text so literal punctuation is not reinterpreted as markdown', () => {
		expect(serialize('a * b')).toBe('a \\* b');
	});

	it('escapes ampersands so text entities render literally', () => {
		expect(serialize('a &lt; b &amp; c')).toBe('a \\&lt; b \\&amp; c');
	});

	it('serializes bold, italic and strike as CommonMark', () => {
		expect(serialize('*bold* _italic_ ~strike~')).toBe('**bold** _italic_ ~~strike~~');
	});

	it('serializes a known user mention as a user scheme link', () => {
		const result = serialize('@rocket.cat', {
			mentions: [{ _id: 'u1', username: 'rocket.cat', name: 'Rocket Cat', type: 'user' }]
		});
		expect(result).toBe('[**rocket\\.cat**](<user://u1>)');
	});

	it('marks the mention itsMe with ?me=1', () => {
		const result = serialize('@rocket.cat', {
			username: 'rocket.cat',
			mentions: [{ _id: 'u1', username: 'rocket.cat', name: 'Rocket Cat', type: 'user' }]
		});
		expect(result).toBe('[**rocket\\.cat**](<user://u1?me=1>)');
	});

	it('marks a team mention with ?team=1', () => {
		const result = serialize('@design-team', {
			mentions: [{ _id: 't1', name: 'design-team', type: 'team' }]
		});
		expect(result).toBe('[**design\\-team**](<user://t1?team=1>)');
	});

	it('renders an unknown user mention as plain text', () => {
		expect(serialize('@unknown-user')).toBe('@unknown\\-user');
	});

	it('serializes a known channel mention as a channel scheme link', () => {
		const result = serialize('#general', { channels: [{ _id: 'r1', name: 'general' }] });
		expect(result).toBe('[**general**](<channel://r1>)');
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

	it('splits a block-level KATEX AST node (as produced by the server-parsed md prop) into a native block math segment', () => {
		const tokens: Parameters<typeof buildRenderSegments>[0] = [{ type: 'KATEX', value: 'x^2' }];
		const segments = buildRenderSegments(tokens, baseContext);
		expect(segments).toEqual([{ type: 'markdown', content: '$$x^2$$', accessibilityLabel: 'x^2' }]);
	});

	it('indents nested lists under their parent item by the parent marker width', () => {
		expect(serialize('- item 1\n  - subitem A\n- item 2')).toBe('- item 1\n  - subitem A\n- item 2');
		expect(serialize('1. first\n   - [x] done\n     1. deep\n2. second')).toBe(
			'1. first\n   - [x] done\n     1. deep\n2. second'
		);
	});

	it('serializes tables as GFM tables with column alignment', () => {
		expect(serialize('| a | b | c |\n| :- | :-: | -: |\n| *x* | y | z |')).toBe(
			'| a | b | c |\n| :--- | :---: | ---: |\n| **x** | y | z |'
		);
	});

	it('escapes pipes inside table cells', () => {
		expect(serialize('| a |\n| - |\n| `x` |')).toBe('| a |\n| --- |\n| `x` |');
	});

	it('serializes spoilers with the double pipe delimiter', () => {
		expect(serialize('before ||hidden|| after')).toBe('before ||hidden|| after');
	});

	it('keeps the lines of a multi-line quote in one paragraph with hard line breaks', () => {
		expect(serialize('> first\n> second\n> third')).toBe('> first\\\n> second\\\n> third');
	});

	it('serializes a horizontal rule as a thematic break', () => {
		expect(serialize('---')).toBe('---');
	});

	it('drops leading indentation so a paragraph never becomes an indented code block', () => {
		expect(serialize('\t*bold* https://a.co')).toBe('**bold** [https://a\\.co](<https://a.co>)');
		expect(serialize('    *bold*')).toBe('**bold**');
	});

	it('collapses newlines inside a link label so the link survives', () => {
		expect(serialize('[a\n\nb](https://a.co)')).toBe('[a b](<https://a.co>)');
	});

	describe('emphasis next to words and punctuation', () => {
		it('pads a strike closer followed by a letter so the strike still closes', () => {
			expect(serialize('~old~new')).toBe('~~old~~ new');
		});

		it('pads a bold opener after a letter when the bold starts with punctuation', () => {
			expect(serialize('a*"q"*')).toBe('a **"q"**');
		});

		it('pads an italic opener after a non-ASCII letter so the underscore still opens', () => {
			expect(serialize('é_x_')).toBe('é _x_');
		});

		it('leaves emphasis between spaces and punctuation unpadded', () => {
			expect(serialize('(*bold*) _it_.')).toBe('\\(**bold**\\) _it_\\.');
		});
	});

	describe('links the user wrote', () => {
		const mentions: ISerializeContext['mentions'] = [{ _id: 'u1', username: 'john', name: 'John', type: 'user' }];
		const channels: ISerializeContext['channels'] = [{ _id: 'c1', name: 'general' }];

		it('renders a mention inside a link label as bold text so links never nest', () => {
			expect(serialize('[~@john~](https://x.co)', { mentions })).toBe('[~~**john**~~](<https://x.co>)');
		});

		it('does not bold a mention again inside a bold link label', () => {
			expect(serialize('[*a @john*](https://x.co)', { mentions })).toBe('[**a john**](<https://x.co>)');
		});

		it('renders a channel inside a link label as bold text', () => {
			expect(serialize('[~#general~](https://x.co)', { channels })).toBe('[~~**general**~~](<https://x.co>)');
		});

		it('renders a timestamp inside a link label as its text', () => {
			expect(serialize('[_<t:1735689600:d>_](https://x.co)')).not.toContain('timestamp://');
		});

		it.each(['user://u1', 'channel://c1', 'timestamp://1', 'USER://u1'])('shows only the label of a link to %s', url => {
			expect(serialize(`[x](${url})`)).toBe('x');
		});
	});

	it('escapes entities and backticks in link destinations so the opened URL matches the label', () => {
		expect(serialize('[x](https://a.co/?q=1&amp;b)')).toBe('[x](<https://a.co/?q=1\\&amp;b>)');
		expect(serialize('[x](https://a.co/`b)')).toBe('[x](<https://a.co/\\`b>)');
	});
});

describe('markdown serialize katex', () => {
	const serializeWithKatex = (msg: string) =>
		buildRenderSegments(parse(msg, { katex: { dollarSyntax: true, parenthesisSyntax: true } }), baseContext)
			.map(segment => (segment.type === 'markdown' ? segment.content : ''))
			.join('\n\n');

	it('pads inline math next to a word so its delimiters still open and close', () => {
		expect(serializeWithKatex('\\(![](https://img.example/a.png)\\)A')).toBe('$![](https://img.example/a.png)$\u200AA');
		expect(serializeWithKatex('\\(a\\)\\(b\\)')).toBe('$a$\u200A$b$');
	});

	it('keeps block math on one line so its lines are not read as markdown blocks', () => {
		expect(serializeWithKatex('\\[a\n\n> b % note\nc\\]')).toBe('$$a > b c$$');
	});

	it('drops a comment that follows a LaTeX line break without dropping the next rows', () => {
		expect(serializeWithKatex('\\[a \\\\% note\nc \\\\ d\\]')).toBe('$$a \\\\ c \\\\ d$$');
	});

	it('keeps an escaped percent sign and one inside verb', () => {
		expect(serializeWithKatex('\\(\\verb|50%| x\\)')).toBe('$\\verb|50%| x$');
		expect(serializeWithKatex('\\(50\\% x\\)')).toBe('$50\\% x$');
	});

	it('falls back to inline code when the formula cannot be a math span', () => {
		expect(serializeWithKatex('\\(a`b\\)')).toBe('``a`b``');
		expect(serializeWithKatex('\\(<https://a.co>\\)')).toBe('`<https://a.co>`');
	});

	it('separates adjacent code spans so their backtick runs do not merge', () => {
		expect(serializeWithKatex('\\(<https://a.co>\\)\\(a`b\\)')).toBe('`<https://a.co>`\u200A``a`b``');
	});

	it('drops empty formulas instead of emitting a bare double dollar', () => {
		expect(serializeWithKatex('a \\(\\) b')).toBe('a  b');
	});
});

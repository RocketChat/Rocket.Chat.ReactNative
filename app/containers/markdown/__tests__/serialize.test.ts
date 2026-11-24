import { parse } from '@rocket.chat/message-parser';
import { renderHook } from '@testing-library/react-native';

import { buildRenderSegments, isBigEmojiOnly, type ISerializeContext } from '../serialize';
import { useParseOptions } from '../hooks/useParseOptions';
import { useSetting } from '~/lib/hooks/useSetting';

jest.mock('~/lib/hooks/useSetting', () => ({
	useSetting: jest.fn()
}));

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

	it('serializes a block-level KATEX node as a block math segment', () => {
		const tokens: Parameters<typeof buildRenderSegments>[0] = [{ type: 'KATEX', value: 'x^2' }];
		const segments = buildRenderSegments(tokens, baseContext);
		expect(segments).toEqual([{ type: 'markdown', content: '$$x^2$$' }]);
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

	it('keeps inline code inside a table cell', () => {
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

	describe('blank leading link', () => {
		it('drops a leading link whose label is blank and trims the text after it', () => {
			expect(serialize('[ ](https://open.rocket.chat/channel/general?msg=abc) hello')).toBe('hello');
		});

		it('drops a blank leading link inside a quote', () => {
			expect(serialize('> [ ](https://open.rocket.chat/channel/general?msg=abc) hello')).toBe('> hello');
		});

		it('renders nothing for a paragraph that is only a blank link', () => {
			expect(serialize('[ ](https://open.rocket.chat/channel/general?msg=abc)')).toBe('');
		});

		it('keeps a leading link with a label', () => {
			expect(serialize('[a](https://a.co) hello')).toBe('[a](<https://a.co>) hello');
		});
	});

	it('keeps mention prefixes when the symbol preferences are enabled', () => {
		const mentionContext = {
			...baseContext,
			channels: [{ _id: 'GENERAL', name: 'general' }],
			mentionsWithAtSymbol: true,
			roomsWithHashTagSymbol: true
		};
		expect(buildRenderSegments(parse('@all #general'), mentionContext)).toEqual([
			{
				type: 'markdown',
				content: '[**@all**](<user://all>) [**\\#general**](<channel://GENERAL>)'
			}
		]);
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

const segmentsFor = (msg: string, katexEnabled: boolean, dollarSyntax: boolean, parenthesisSyntax: boolean) => {
	const settings: Record<string, boolean> = {
		Katex_Enabled: katexEnabled,
		Katex_Dollar_Syntax: dollarSyntax,
		Katex_Parenthesis_Syntax: parenthesisSyntax
	};
	jest.mocked(useSetting).mockImplementation(key => settings[key]);
	const { result } = renderHook(() => useParseOptions());
	return buildRenderSegments(parse(msg, result.current), baseContext);
};

describe('markdown katex settings', () => {
	it('serializes inline dollar math as a latex math span when dollar syntax is enabled', () => {
		expect(segmentsFor('Inline $x^2 + y^2 = z^2$ katex', true, true, false)).toEqual([
			{ type: 'markdown', content: 'Inline $x^2 + y^2 = z^2$ katex' }
		]);
	});

	it('escapes dollar signs as plain text when dollar syntax is disabled', () => {
		expect(segmentsFor('Inline $x^2$ katex', true, false, true)).toEqual([
			{ type: 'markdown', content: 'Inline \\$x\\^2\\$ katex' }
		]);
	});

	it('splits double dollar math into a native block math segment when dollar syntax is enabled', () => {
		expect(segmentsFor('$$\\int_0^1 x\\,dx = \\frac{1}{2}$$', true, true, false)).toEqual([
			{
				type: 'markdown',
				content: '$$\\int_0^1 x\\,dx = \\frac{1}{2}$$'
			}
		]);
	});

	it('serializes bracket matrix math as a native block math segment when parenthesis syntax is enabled', () => {
		const matrix = '\\frac{a}{b} + \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}';
		expect(segmentsFor(`\\[${matrix}\\]`, true, false, true)).toEqual([{ type: 'markdown', content: `$$${matrix}$$` }]);
	});

	it('serializes parenthesis math as a latex math span when parenthesis syntax is enabled', () => {
		expect(segmentsFor('Paren \\(a+b\\) inline', true, false, true)).toEqual([
			{ type: 'markdown', content: 'Paren $a+b$ inline' }
		]);
	});

	it('keeps math delimiters as plain text when katex is disabled', () => {
		expect(segmentsFor('Paren \\(a+b\\) and $x$', false, true, true)).toEqual([
			{ type: 'markdown', content: 'Paren \\\\\\(a\\+b\\\\\\) and \\$x\\$' }
		]);
	});
});

describe('isBigEmojiOnly', () => {
	const formatShortnameToUnicode: ISerializeContext['formatShortnameToUnicode'] = shortname =>
		({ ':smile:': '😄', ':slight_smile:': '🙂' })[shortname] ?? shortname;
	const getCustomEmoji: ISerializeContext['getCustomEmoji'] = name =>
		name === 'marioparty' ? { name: 'marioparty', extension: 'gif' } : null;
	const bigEmojiOnly = (msg: string, ctx: Partial<ISerializeContext> = {}) =>
		isBigEmojiOnly(parse(msg, { emoticons: true }), { ...baseContext, formatShortnameToUnicode, getCustomEmoji, ...ctx });

	it.each(['😀', ':smile:', ':marioparty:', ':smile: 😀 :marioparty:', ':)'])('is true for %s', msg => {
		expect(bigEmojiOnly(msg)).toBe(true);
	});

	it('is false for a shortcode that is not an emoji', () => {
		expect(bigEmojiOnly(':notanemoji:')).toBe(false);
	});

	it('is false when one of several shortcodes is not an emoji', () => {
		expect(bigEmojiOnly(':smile: :notanemoji:')).toBe(false);
	});

	it('is false for an ascii emoticon when the user does not convert them', () => {
		expect(bigEmojiOnly(':)', { convertAsciiEmoji: false })).toBe(false);
	});

	it('is false for a sentence with an emoji', () => {
		expect(bigEmojiOnly('hi :smile:')).toBe(false);
	});
});

describe('markdown ascii emoticons', () => {
	const toSmiley = (shortname: string) => (shortname === ':slight_smile:' ? '🙂' : shortname);
	const serializeEmoticons = (msg: string, convertAsciiEmoji: boolean) =>
		buildRenderSegments(parse(msg, { emoticons: true }), {
			...baseContext,
			convertAsciiEmoji,
			formatShortnameToUnicode: toSmiley
		});

	it('converts an ascii emoticon to its emoji when the user converts them', () => {
		expect(serializeEmoticons('hi :)', true)).toEqual([{ type: 'markdown', content: 'hi 🙂' }]);
	});

	it('shows an ascii emoticon as typed when the user does not convert them', () => {
		expect(serializeEmoticons('hi :)', false)).toEqual([{ type: 'markdown', content: 'hi :\\)' }]);
	});
});

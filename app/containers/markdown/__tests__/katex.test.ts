import { parse } from '@rocket.chat/message-parser';

import { buildRenderSegments, type ISerializeContext } from '../serialize';
import { buildParseOptions } from '../hooks/useParseOptions';

const context: ISerializeContext = {
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

const segmentsFor = (msg: string, katexEnabled: boolean, dollarSyntax: boolean, parenthesisSyntax: boolean) =>
	buildRenderSegments(parse(msg, buildParseOptions(katexEnabled, dollarSyntax, parenthesisSyntax)), context);

describe('markdown katex', () => {
	it('serializes inline dollar math as a latex math span when dollar syntax is enabled', () => {
		expect(segmentsFor('Inline $x^2 + y^2 = z^2$ katex', true, true, false)).toEqual([
			{ type: 'markdown', content: 'Inline $x^2 + y^2 = z^2$ katex', accessibilityLabel: 'Inline x^2 + y^2 = z^2 katex' }
		]);
	});

	it('escapes dollar signs as plain text when dollar syntax is disabled', () => {
		expect(segmentsFor('Inline $x^2$ katex', true, false, true)).toEqual([
			{ type: 'markdown', content: 'Inline \\$x\\^2\\$ katex', accessibilityLabel: 'Inline $x^2$ katex' }
		]);
	});

	it('splits double dollar math into a native block math segment when dollar syntax is enabled', () => {
		expect(segmentsFor('$$\\int_0^1 x\\,dx = \\frac{1}{2}$$', true, true, false)).toEqual([
			{
				type: 'markdown',
				content: '$$\n\\int_0^1 x\\,dx = \\frac{1}{2}\n$$',
				accessibilityLabel: '\\int_0^1 x\\,dx = \\frac{1}{2}'
			}
		]);
	});

	it('serializes bracket matrix math as a native block math segment when parenthesis syntax is enabled', () => {
		const matrix = '\\frac{a}{b} + \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}';
		expect(segmentsFor(`\\[${matrix}\\]`, true, false, true)).toEqual([
			{ type: 'markdown', content: `$$\n${matrix}\n$$`, accessibilityLabel: matrix }
		]);
	});

	it('keeps mention prefixes when the symbol preferences are enabled', () => {
		const tokens = parse('@all #general');
		const mentionContext = {
			...context,
			channels: [{ _id: 'GENERAL', name: 'general' }],
			mentionsWithAtSymbol: true,
			roomsWithHashTagSymbol: true
		};
		expect(buildRenderSegments(tokens, mentionContext)).toEqual([
			{
				type: 'markdown',
				content: '[**@all**](<user://all>) [**\\#general**](<channel://GENERAL>)',
				accessibilityLabel: '@all #general'
			}
		]);
	});

	it('serializes parenthesis math as a latex math span when parenthesis syntax is enabled', () => {
		expect(segmentsFor('Paren \\(a+b\\) inline', true, false, true)).toEqual([
			{ type: 'markdown', content: 'Paren $a+b$ inline', accessibilityLabel: 'Paren a+b inline' }
		]);
	});

	it('keeps math delimiters as plain text when katex is disabled', () => {
		expect(segmentsFor('Paren \\(a+b\\) and $x$', false, true, true)).toEqual([
			{ type: 'markdown', content: 'Paren \\\\\\(a\\+b\\\\\\) and \\$x\\$', accessibilityLabel: 'Paren \\(a+b\\) and $x$' }
		]);
	});
});

import type {
	Root,
	Paragraph,
	Inlines,
	Color as ColorBlock,
	Emoji as EmojiBlock,
	Link as LinkBlock,
	Timestamp as TimestampBlock,
	NestedList,
	Table,
	TableCell
} from '@rocket.chat/message-parser';

import dayjs from '~/lib/dayjs';
import { type IUserMention, type IUserChannel } from './interfaces';
import { type ICustomEmoji, type TGetCustomEmoji } from '~/definitions/IEmoji';
import { buildChannelLink, buildTimestampLink, buildUserLink, isInternalLink } from './linkSchemes';

export interface ISerializeContext {
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	useRealName?: boolean;
	username?: string;
	mentionsWithAtSymbol: boolean;
	roomsWithHashTagSymbol: boolean;
	getCustomEmoji: TGetCustomEmoji;
	baseUrl: string;
	convertAsciiEmoji: boolean;
	formatShortnameToUnicode: (shortname: string) => string;
}

export type TRenderSegment = { type: 'markdown'; content: string } | { type: 'linebreak' };

const ESCAPE_PATTERN = /[\\`*_{}[\]()#+\-.!|~^$=<>&]/g;

const escapePlainText = (value: string): string => value.replace(ESCAPE_PATTERN, '\\$&').replace(/\s*\n\s*/g, ' ');

const escapeUrl = (url: string): string => `<${url.replace(/[\\<>&`]/g, '\\$&')}>`;

const URL_CHARACTER_TO_ENCODE = /%(?![0-9A-Fa-f]{2})|[^A-Za-z0-9;,/?:@&=+$\-_.!~*'()#%]/gu;
const ENCODED_REPLACEMENT_CHARACTER = encodeURIComponent('\uFFFD');

const percentEncodeCharacter = (character: string): string => {
	try {
		return encodeURIComponent(character);
	} catch {
		return ENCODED_REPLACEMENT_CHARACTER;
	}
};

const percentEncodeUrl = (url: string): string => url.replace(URL_CHARACTER_TO_ENCODE, percentEncodeCharacter);

const withoutLeadingIndent = (line: string): string => line.replace(/^[ \t]+/, '');

const timestampToUnixSeconds = (timestamp: string): number => {
	if (/^-?\d{10}$/.test(timestamp)) return Number(timestamp);
	if (/^-?\d{13}$/.test(timestamp)) return Math.floor(Number(timestamp) / 1000);
	return Math.floor(dayjs(timestamp).valueOf() / 1000);
};

export const TIMESTAMP_FULL_FORMAT = 'dddd, MMM DD, YYYY hh:mm A';

type TTimestampFormat = TimestampBlock['value']['format'];

const TIMESTAMP_FORMATS: Record<Exclude<TTimestampFormat, 'R'>, string> = {
	t: 'hh:mm A',
	T: 'hh:mm:ss A',
	d: 'MM/DD/YYYY',
	D: 'dddd, MMM DD, YYYY',
	f: TIMESTAMP_FULL_FORMAT,
	F: 'dddd, MMM DD, YYYY hh:mm:ss A'
};

const formatTimestampLabel = (unixSeconds: number, format: TTimestampFormat): string => {
	const time = dayjs(unixSeconds * 1000);
	return format === 'R' ? time.fromNow() : time.format(TIMESTAMP_FORMATS[format]);
};

interface IResolvedMention {
	text: string;
	url?: string;
}

const resolveUserMention = (mention: string, context: ISerializeContext): IResolvedMention => {
	const prefix = context.mentionsWithAtSymbol ? '@' : '';
	if (mention === 'all' || mention === 'here') {
		return { text: prefix + mention, url: buildUserLink(mention) };
	}
	const found = context.mentions?.find(candidate => candidate && (candidate.username === mention || candidate.name === mention));
	if (!found) {
		return { text: `@${mention}` };
	}
	const label = found.type === 'user' ? (context.useRealName && found.name ? found.name : found.username) : found.name;
	const kind = found.type === 'team' ? 'team' : mention === context.username ? 'me' : 'user';
	return { text: prefix + (label ?? mention), url: buildUserLink(found._id, kind) };
};

const resolveChannelMention = (hashtag: string, context: ISerializeContext): IResolvedMention => {
	const channel = context.channels?.find(candidate => candidate.name === hashtag);
	if (!channel?._id) {
		return { text: `#${hashtag}` };
	}
	const prefix = context.roomsWithHashTagSymbol ? '#' : '';
	return { text: prefix + hashtag, url: buildChannelLink(channel._id) };
};

const serializeMention = ({ text, url }: IResolvedMention): string =>
	url ? `[**${escapePlainText(text)}**](${escapeUrl(url)})` : escapePlainText(text);

type TResolvedEmoji =
	| { kind: 'custom'; customEmoji: ICustomEmoji }
	| { kind: 'unicode'; text: string }
	| { kind: 'plain'; text: string };

const resolveEmoji = (block: EmojiBlock, context: ISerializeContext): TResolvedEmoji => {
	if ('unicode' in block) {
		return { kind: 'unicode', text: block.unicode };
	}
	const customEmoji = context.getCustomEmoji(block.value.value.replace(/:/g, ''));
	if (customEmoji) {
		return { kind: 'custom', customEmoji };
	}
	const isAsciiEmoji = block.value.value !== block.shortCode;
	if (isAsciiEmoji && !context.convertAsciiEmoji) {
		return { kind: 'plain', text: block.value.value };
	}
	const shortname = `:${block.shortCode}:`;
	const unicode = context.formatShortnameToUnicode(shortname);
	return unicode === shortname ? { kind: 'plain', text: shortname } : { kind: 'unicode', text: unicode };
};

const rendersAsEmoji = (block: EmojiBlock, context: ISerializeContext): boolean => resolveEmoji(block, context).kind !== 'plain';

export const isBigEmojiOnly = (root: Root, context: ISerializeContext): boolean => {
	const [firstBlock] = root;
	return root.length === 1 && firstBlock.type === 'BIG_EMOJI' && firstBlock.value.every(block => rendersAsEmoji(block, context));
};

const WORD_JOINER = '\u2060';

const serializeEmoji = (block: EmojiBlock, context: ISerializeContext): string => {
	const emoji = resolveEmoji(block, context);
	switch (emoji.kind) {
		case 'custom':
			return `${WORD_JOINER}![](${context.baseUrl}/emoji-custom/${encodeURIComponent(emoji.customEmoji.name)}.${emoji.customEmoji.extension})`;
		case 'unicode':
		case 'plain':
			return escapePlainText(emoji.text);
	}
};

const toHexByte = (channel: number): string => channel.toString(16).padStart(2, '0');

const serializeColor = ({ r, g, b, a }: ColorBlock['value']): string => {
	const channels = a === 255 ? [r, g, b] : [r, g, b, a];
	return escapePlainText(`color:#${channels.map(toHexByte).join('')}`);
};

const longestBacktickRun = (text: string): number =>
	(text.match(/`+/g) ?? []).reduce((longest, run) => Math.max(longest, run.length), 0);

const backtickFence = (code: string, minimumLength: number): string =>
	'`'.repeat(Math.max(minimumLength, longestBacktickRun(code) + 1));

const serializeInlineCode = (code: string): string => {
	const fence = backtickFence(code, 1);
	const padded = code.startsWith('`') || code.endsWith('`') ? ` ${code} ` : code;
	return `${fence}${padded}${fence}`;
};

const HAIR_SPACE = ' ';
const LATEX_VERB = /\\verb\*?([^a-zA-Z*\s])/y;
const ANGLE_AUTOLINK = /<[A-Za-z][A-Za-z0-9.+-]{1,31}:[^\s<>]*>|<[^\s<>@]+@[^\s<>]+>/;

const latexTokenLength = (latex: string, start: number): number => {
	if (latex[start] !== '\\') {
		return 1;
	}
	LATEX_VERB.lastIndex = start;
	const verb = LATEX_VERB.exec(latex);
	if (verb) {
		const closing = latex.indexOf(verb[1], start + verb[0].length);
		return closing === -1 ? latex.length - start : closing + 1 - start;
	}
	return 2;
};

const withoutLatexComments = (latex: string): string => {
	let kept = '';
	let index = 0;
	while (index < latex.length) {
		if (latex[index] === '%') {
			const lineEnd = latex.indexOf('\n', index);
			index = lineEnd === -1 ? latex.length : lineEnd;
			continue;
		}
		const length = latexTokenLength(latex, index);
		kept += latex.slice(index, index + length);
		index += length;
	}
	return kept;
};

const flattenLatex = (latex: string): string =>
	withoutLatexComments(latex)
		.replace(/\s*\n\s*/g, ' ')
		.trim();

const isSafeMathSpanContent = (latex: string): boolean =>
	!/[$`]/.test(latex) && !latex.endsWith('\\') && !ANGLE_AUTOLINK.test(latex);

const serializeMath = (latex: string, delimiter: '$' | '$$'): string => {
	const flatLatex = flattenLatex(latex);
	if (!flatLatex) {
		return '';
	}
	return isSafeMathSpanContent(flatLatex) ? `${delimiter}${flatLatex}${delimiter}` : serializeInlineCode(flatLatex);
};

const isMathDelimiterBoundary = (char: string | undefined): boolean => char === undefined || /[\s!-#%-/:-@[-`{-~]/.test(char);

const padMathSpan = (span: string, before: string, nextChar: string | undefined): string => {
	if (!span.startsWith('$')) {
		return span;
	}
	const leading = isMathDelimiterBoundary(before.at(-1)) ? '' : HAIR_SPACE;
	const trailing = isMathDelimiterBoundary(nextChar) ? '' : HAIR_SPACE;
	return `${leading}${span}${trailing}`;
};

const toLinkLabelValue = (label: LinkBlock['value']['label']): Inlines[] => (Array.isArray(label) ? label : [label]);

const DELIMITED_TYPES = new Set<Inlines['type']>(['BOLD', 'ITALIC', 'STRIKE', 'MENTION_USER', 'MENTION_CHANNEL']);
const EMPHASIS_DELIMITER_CHARS = '*_~';

const DELIMITER_WHITESPACE = '[\\p{Zs}\\t\\n\\v\\f\\r]';
const EDGE_WHITESPACE = new RegExp(`^(${DELIMITER_WHITESPACE}*)(.*?)(${DELIMITER_WHITESPACE}*)$`, 'su');
const DELIMITER_BOUNDARY = new RegExp(`${DELIMITER_WHITESPACE}|[\\p{P}\\p{S}]`, 'u');

const wrapEmphasis = (content: string, delimiter: string): string => {
	const [, leading = '', core = '', trailing = ''] = content.match(EDGE_WHITESPACE) ?? [];
	return core ? `${leading}${delimiter}${core}${delimiter}${trailing}` : `${leading}${trailing}`;
};

const isEmphasisDelimiterBoundary = (char: string | undefined, delimiterChar: string): boolean =>
	char === undefined || (char !== delimiterChar && DELIMITER_BOUNDARY.test(char));

const needsHairSpace = (delimiterChar: string | undefined, neighbor: string | undefined): boolean =>
	!!delimiterChar && EMPHASIS_DELIMITER_CHARS.includes(delimiterChar) && !isEmphasisDelimiterBoundary(neighbor, delimiterChar);

const padEmphasisSpan = (span: string, before: string, nextChar: string | undefined): string => {
	const leading = needsHairSpace(span[0], before.at(-1)) ? HAIR_SPACE : '';
	const trailing = needsHairSpace(span.at(-1), nextChar) ? HAIR_SPACE : '';
	return `${leading}${span}${trailing}`;
};

const padCodeSpan = (span: string, before: string): string => (before.endsWith('`') ? `${HAIR_SPACE}${span}` : span);

const padSpan = (node: Inlines, span: string, before: string, nextChar: string | undefined): string => {
	if (span.startsWith('`')) {
		return padCodeSpan(span, before);
	}
	if (node.type === 'INLINE_KATEX') {
		return padMathSpan(span, before, nextChar);
	}
	if (DELIMITED_TYPES.has(node.type)) {
		return padEmphasisSpan(span, before, nextChar);
	}
	return span;
};

const isRenderedLink = (node: LinkBlock): boolean => !!node.value.src.value && !isInternalLink(node.value.src.value);

const withoutDroppedLinks = (nodes: Inlines[]): Inlines[] =>
	nodes.flatMap(node =>
		node.type === 'LINK' && !isRenderedLink(node) ? withoutDroppedLinks(toLinkLabelValue(node.value.label)) : [node]
	);

interface IInlineScope {
	insideLink: boolean;
	insideBold: boolean;
}

const TOP_LEVEL_SCOPE: IInlineScope = { insideLink: false, insideBold: false };

const firstCharsAfter = (parts: string[]): (string | undefined)[] => {
	const nextChars = new Array<string | undefined>(parts.length);
	let nextChar: string | undefined;
	for (let index = parts.length - 1; index >= 0; index -= 1) {
		nextChars[index] = nextChar;
		nextChar = parts[index][0] ?? nextChar;
	}
	return nextChars;
};

const serializeInline = (inlines: Inlines[], context: ISerializeContext, scope = TOP_LEVEL_SCOPE): string => {
	const nodes = withoutDroppedLinks(inlines);
	const parts = nodes.map(node => serializeInlineNode(node, context, scope));
	const nextChars = firstCharsAfter(parts);
	return parts.reduce((serialized, part, index) => serialized + padSpan(nodes[index], part, serialized, nextChars[index]), '');
};

const serializeMentionInScope = (mention: IResolvedMention, scope: IInlineScope): string => {
	if (!scope.insideLink) {
		return serializeMention(mention);
	}
	const text = escapePlainText(mention.text);
	return mention.url && !scope.insideBold ? `**${text}**` : text;
};

const serializeInlineNode = (node: Inlines, context: ISerializeContext, scope: IInlineScope): string => {
	switch (node.type) {
		case 'PLAIN_TEXT':
			return escapePlainText(node.value);
		case 'BOLD':
			return wrapEmphasis(serializeInline(node.value, context, { ...scope, insideBold: true }), '**');
		case 'ITALIC':
			return wrapEmphasis(serializeInline(node.value, context, scope), '_');
		case 'STRIKE':
			return wrapEmphasis(serializeInline(node.value, context, scope), '~~');
		case 'SPOILER':
			return `||${serializeInline(node.value, context, scope)}||`;
		case 'LINK':
			return `[${serializeInline(toLinkLabelValue(node.value.label), context, { ...scope, insideLink: true })}](${escapeUrl(node.value.src.value)})`;
		case 'MENTION_USER':
			return serializeMentionInScope(resolveUserMention(node.value.value, context), scope);
		case 'MENTION_CHANNEL':
			return serializeMentionInScope(resolveChannelMention(node.value.value, context), scope);
		case 'EMOJI':
			return serializeEmoji(node, context);
		case 'INLINE_CODE':
			return serializeInlineCode(node.value.value);
		case 'INLINE_KATEX':
			return serializeMath(node.value, '$');
		case 'TIMESTAMP': {
			const unixSeconds = timestampToUnixSeconds(node.value.timestamp);
			const label = formatTimestampLabel(unixSeconds, node.value.format);
			if (scope.insideLink) {
				return escapePlainText(label);
			}
			return `[${escapePlainText(` ${label} `)}](${escapeUrl(buildTimestampLink(unixSeconds))})`;
		}
		case 'IMAGE':
			return `![](${escapeUrl(percentEncodeUrl(node.value.src.value))})`;
		case 'COLOR':
			return serializeColor(node.value);
		default:
			return '';
	}
};

const isBlankLink = (node: Inlines | undefined): boolean =>
	node?.type === 'LINK' &&
	toLinkLabelValue(node.value.label).every(labelNode => labelNode.type === 'PLAIN_TEXT' && labelNode.value.trim() === '');

const resolveParagraphNodes = (value: Paragraph['value']): Paragraph['value'] => {
	if (!isBlankLink(value[0])) {
		return value;
	}
	const [, next, ...rest] = value;
	if (next?.type === 'PLAIN_TEXT') {
		return [{ ...next, value: next.value.trimStart() }, ...rest];
	}
	return value.slice(1);
};

const serializeParagraphValue = (value: Paragraph['value'], context: ISerializeContext): string =>
	withoutLeadingIndent(serializeInline(resolveParagraphNodes(value), context));

const indentLines = (text: string, width: number): string => {
	const indent = ' '.repeat(width);
	return text
		.split('\n')
		.map(line => (line ? indent + line : line))
		.join('\n');
};

const listItemMarker = (list: NestedList, index: number): string =>
	list.type === 'ORDERED_LIST' ? `${list.value[index].number ?? index + 1}. ` : '- ';

const taskCheckbox = (list: NestedList, index: number): string =>
	list.type === 'TASKS' ? `[${list.value[index].status ? 'x' : ' '}] ` : '';

const serializeList = (list: NestedList, context: ISerializeContext): string =>
	list.value
		.map((item, index) => {
			const marker = listItemMarker(list, index);
			const line = `${marker}${taskCheckbox(list, index)}${withoutLeadingIndent(serializeInline(item.value, context))}`;
			const nested = (item.nested ?? []).map(child => indentLines(serializeList(child, context), marker.length));
			return [line, ...nested].join('\n');
		})
		.join('\n');

const tableAlignmentMarker = (cell: TableCell): string => {
	switch (cell.align) {
		case 'left':
			return ':---';
		case 'center':
			return ':---:';
		case 'right':
			return '---:';
		default:
			return '---';
	}
};

const serializeTableRow = (cells: TableCell[], context: ISerializeContext): string =>
	`| ${cells.map(cell => serializeInline(cell.value, context)).join(' | ')} |`;

const serializeTable = ({ value: { header, rows } }: Table, context: ISerializeContext): string =>
	[
		serializeTableRow(header, context),
		`| ${header.map(tableAlignmentMarker).join(' | ')} |`,
		...rows.map(row => serializeTableRow(row.value, context))
	].join('\n');

type TRootBlock = Root[number];

const serializeBlock = (block: TRootBlock, context: ISerializeContext): string => {
	switch (block.type) {
		case 'BIG_EMOJI':
			return block.value.map(emojiBlock => serializeEmoji(emojiBlock, context)).join('');
		case 'KATEX':
			return serializeMath(block.value, '$$');
		case 'PARAGRAPH':
			return serializeParagraphValue(block.value, context);
		case 'HEADING':
			return `${'#'.repeat(block.level)} ${serializeInline(block.value, context)}`;
		case 'QUOTE':
			return block.value
				.map(item => serializeParagraphValue(item.value, context))
				.map(line => `> ${line}`)
				.join('\\\n');
		case 'UNORDERED_LIST':
		case 'ORDERED_LIST':
		case 'TASKS':
			return serializeList(block, context);
		case 'SPOILER_BLOCK':
			return block.value
				.map(paragraph => serializeParagraphValue(paragraph.value, context))
				.filter(Boolean)
				.map(line => `||${line}||`)
				.join('\n\n');
		case 'TABLE':
			return serializeTable(block, context);
		case 'HORIZONTAL_RULE':
			return '---';
		case 'CODE': {
			const code = block.value.map(line => line.value.value).join('\n');
			const fence = backtickFence(code, 3);
			return `${fence}\n${code}\n${fence}`;
		}
		default:
			return '';
	}
};

export const buildRenderSegments = (root: Root, context: ISerializeContext): TRenderSegment[] =>
	(root as TRootBlock[]).flatMap((block): TRenderSegment[] => {
		if (block.type === 'LINE_BREAK') {
			return [{ type: 'linebreak' }];
		}
		const content = serializeBlock(block, context);
		return content ? [{ type: 'markdown', content }] : [];
	});

import type {
	Root,
	BigEmoji,
	Paragraph,
	Blocks,
	Inlines,
	Emoji as EmojiBlock,
	Link as LinkBlock,
	Timestamp as TimestampBlock,
	NestedList,
	Table,
	TableCell
} from '@rocket.chat/message-parser';

import dayjs from '~/lib/dayjs';
import { type IUserMention, type IUserChannel } from './interfaces';
import { type TGetCustomEmoji } from '~/definitions/IEmoji';
import {
	CHANNEL_SCHEME,
	ME_QUERY,
	TEAM_QUERY,
	TIMESTAMP_FULL_FORMAT,
	TIMESTAMP_SCHEME,
	USER_SCHEME,
	isInternalLink
} from './linkSchemes';

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

export type TRenderSegment = { type: 'markdown'; content: string; accessibilityLabel: string } | { type: 'linebreak' };

const ESCAPE_PATTERN = /[\\`*_{}[\]()#+\-.!|~^$=<>&]/g;

export const escapePlainText = (value: string): string => value.replace(ESCAPE_PATTERN, '\\$&').replace(/\s*\n\s*/g, ' ');

const escapeUrl = (url: string): string => `<${url.replace(/[\\<>&`]/g, '\\$&')}>`;

const withoutLeadingIndent = (line: string): string => line.replace(/^[ \t]+/, '');

const timestampToUnixSeconds = (timestamp: string): number => {
	if (/^-?\d{10}$/.test(timestamp)) return Number(timestamp);
	if (/^-?\d{13}$/.test(timestamp)) return Math.floor(Number(timestamp) / 1000);
	return Math.floor(dayjs(timestamp).valueOf() / 1000);
};

export const isBigEmojiOnly = (tokens: Root | null): tokens is [BigEmoji] =>
	!!tokens && tokens.length === 1 && tokens[0].type === 'BIG_EMOJI';

const formatTimestampLabel = (value: TimestampBlock['value']): string => {
	const timestampMs = timestampToUnixSeconds(value.timestamp) * 1000;
	switch (value.format) {
		case 't':
			return dayjs(timestampMs).format('hh:mm A');
		case 'T':
			return dayjs(timestampMs).format('hh:mm:ss A');
		case 'd':
			return dayjs(timestampMs).format('MM/DD/YYYY');
		case 'D':
			return dayjs(timestampMs).format('dddd, MMM DD, YYYY');
		case 'f':
			return dayjs(timestampMs).format(TIMESTAMP_FULL_FORMAT);
		case 'F':
			return dayjs(timestampMs).format('dddd, MMM DD, YYYY hh:mm:ss A');
		case 'R':
			return dayjs(timestampMs).fromNow();
		default:
			return 'Invalid Date';
	}
};

interface IUserMentionLabel {
	label: string;
	rid: string;
	query: string;
}

const resolveUserMentionLabel = (mention: string, context: ISerializeContext): IUserMentionLabel | null => {
	const found = context.mentions?.find(candidate => candidate && (candidate.username === mention || candidate.name === mention));
	if (!found) {
		return null;
	}

	const label = found.type === 'user' ? (context.useRealName && found.name ? found.name : found.username) : found.name;
	const itsMe = mention === context.username;
	const query = found.type === 'team' ? TEAM_QUERY : itsMe ? ME_QUERY : '';

	return { label: label ?? mention, rid: found._id, query };
};

const findChannelRid = (hashtag: string, context: ISerializeContext): string | null => {
	const found = context.channels?.find(channel => channel.name === hashtag);
	return found?._id ?? null;
};

interface IResolvedMention {
	text: string;
	url?: string;
}

const resolveUserMention = (mention: string, context: ISerializeContext): IResolvedMention => {
	const prefix = context.mentionsWithAtSymbol ? '@' : '';
	if (mention === 'all' || mention === 'here') {
		return { text: prefix + mention, url: `${USER_SCHEME}${mention}` };
	}
	const resolved = resolveUserMentionLabel(mention, context);
	if (!resolved) {
		return { text: `@${mention}` };
	}
	return { text: prefix + resolved.label, url: `${USER_SCHEME}${resolved.rid}${resolved.query}` };
};

const resolveChannelMention = (hashtag: string, context: ISerializeContext): IResolvedMention => {
	const rid = findChannelRid(hashtag, context);
	if (!rid) {
		return { text: `#${hashtag}` };
	}
	const prefix = context.roomsWithHashTagSymbol ? '#' : '';
	return { text: prefix + hashtag, url: `${CHANNEL_SCHEME}${rid}` };
};

const serializeMention = ({ text, url }: IResolvedMention): string =>
	url ? `[**${escapePlainText(text)}**](${escapeUrl(url)})` : escapePlainText(text);

const emojiDisplayText = (block: EmojiBlock, context: ISerializeContext): string => {
	if ('unicode' in block) {
		return block.unicode;
	}

	const emojiToken = `:${block.shortCode}:`;
	const emojiUnicode = context.formatShortnameToUnicode(emojiToken);
	const isAsciiEmoji = block.value.value !== block.shortCode;

	if (!context.convertAsciiEmoji && isAsciiEmoji) {
		return block.value.value;
	}

	return emojiUnicode;
};

const WORD_JOINER = '\u2060';

const serializeEmoji = (block: EmojiBlock, context: ISerializeContext): string => {
	const emojiName = 'unicode' in block ? '' : block.value.value.replace(/:/g, '');
	const customEmoji = 'unicode' in block ? null : context.getCustomEmoji(emojiName);
	if (customEmoji) {
		return `${WORD_JOINER}![](${context.baseUrl}/emoji-custom/${encodeURIComponent(customEmoji.name)}.${customEmoji.extension})`;
	}

	return escapePlainText(emojiDisplayText(block, context));
};

const serializeInlineCode = (value: { value: string }): string => {
	const text = value.value;
	const longestTickRun = Math.max(0, ...(text.match(/`+/g) ?? []).map(run => run.length));
	const fence = '`'.repeat(longestTickRun + 1);
	const padded = text.startsWith('`') || text.endsWith('`') ? ` ${text} ` : text;
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
	return isSafeMathSpanContent(flatLatex) ? `${delimiter}${flatLatex}${delimiter}` : serializeInlineCode({ value: flatLatex });
};

const isMathDelimiterBoundary = (char: string | undefined): boolean => char === undefined || /[\s!-#%-/:-@[-`{-~]/.test(char);

const padMathSpan = (span: string, before: string, after: string): string => {
	if (!span.startsWith('$')) {
		return span;
	}
	const leading = isMathDelimiterBoundary(before.at(-1)) ? '' : HAIR_SPACE;
	const trailing = isMathDelimiterBoundary(after[0]) ? '' : HAIR_SPACE;
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

const padEmphasisSpan = (span: string, before: string, after: string): string => {
	const leading = needsHairSpace(span[0], before.at(-1)) ? HAIR_SPACE : '';
	const trailing = needsHairSpace(span.at(-1), after[0]) ? HAIR_SPACE : '';
	return `${leading}${span}${trailing}`;
};

const padSpan = (node: Inlines, span: string, before: string, after: string): string => {
	if (node.type === 'INLINE_KATEX') {
		return padMathSpan(span, before, after);
	}
	if (DELIMITED_TYPES.has(node.type)) {
		return padEmphasisSpan(span, before, after);
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

const serializeInline = (inlines: Inlines[], context: ISerializeContext, scope = TOP_LEVEL_SCOPE): string => {
	const nodes = withoutDroppedLinks(inlines);
	const parts = nodes.map(node => serializeInlineNode(node, context, scope));
	return parts.reduce(
		(serialized, part, index) => serialized + padSpan(nodes[index], part, serialized, parts.slice(index + 1).join('')),
		''
	);
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
			return serializeInlineCode(node.value);
		case 'INLINE_KATEX':
			return serializeMath(node.value, '$');
		case 'TIMESTAMP': {
			const label = formatTimestampLabel(node.value);
			if (scope.insideLink) {
				return escapePlainText(label);
			}
			const unixSeconds = timestampToUnixSeconds(node.value.timestamp);
			return `[${escapePlainText(` ${label} `)}](${escapeUrl(`${TIMESTAMP_SCHEME}${unixSeconds}`)})`;
		}
		case 'IMAGE':
			return `![](${escapeUrl(node.value.src.value)})`;
		default:
			return '';
	}
};

const plainTextInline = (nodes: Inlines[], context: ISerializeContext): string =>
	nodes.map(node => plainTextNode(node, context)).join('');

const plainTextNode = (node: Inlines, context: ISerializeContext): string => {
	switch (node.type) {
		case 'PLAIN_TEXT':
			return node.value;
		case 'BOLD':
		case 'ITALIC':
		case 'STRIKE':
		case 'SPOILER':
			return plainTextInline(node.value, context);
		case 'LINK':
			return plainTextInline(toLinkLabelValue(node.value.label), context);
		case 'MENTION_USER':
			return resolveUserMention(node.value.value, context).text;
		case 'MENTION_CHANNEL':
			return resolveChannelMention(node.value.value, context).text;
		case 'EMOJI':
			return emojiDisplayText(node, context);
		case 'INLINE_CODE':
			return node.value.value;
		case 'INLINE_KATEX':
			return node.value;
		case 'TIMESTAMP':
			return formatTimestampLabel(node.value);
		default:
			return '';
	}
};

const trimForceTrimNodes = (value: Paragraph['value']): Paragraph['value'] =>
	value.map((node, index) =>
		index === 1 && node.type === 'PLAIN_TEXT' ? { ...node, value: node.value.replace(/^\s+/, '') } : node
	);

const resolveParagraphNodes = (value: Paragraph['value']): Paragraph['value'] | null => {
	if (value[0]?.type === 'LINK') {
		const label = value[0].value.label;
		const labelText = (Array.isArray(label) ? label[0] : label)?.value?.toString().trim() ?? '';
		if (labelText === '') {
			if (value.length === 1) {
				return null;
			}
			if (value.length === 2 && value[1].type === 'PLAIN_TEXT' && value[1].value.trim() === '') {
				return null;
			}
			return trimForceTrimNodes(value);
		}
	}

	return value;
};

const serializeParagraphValue = (value: Paragraph['value'], context: ISerializeContext): string | null => {
	const nodes = resolveParagraphNodes(value);
	return nodes ? withoutLeadingIndent(serializeInline(nodes, context)) : null;
};

const plainTextParagraphValue = (value: Paragraph['value'], context: ISerializeContext): string | null => {
	const nodes = resolveParagraphNodes(value);
	return nodes ? plainTextInline(nodes, context) : null;
};

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

const plainTextList = (list: NestedList, context: ISerializeContext): string =>
	list.value
		.flatMap(item => [plainTextInline(item.value, context), ...(item.nested ?? []).map(child => plainTextList(child, context))])
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

const plainTextTable = ({ value: { header, rows } }: Table, context: ISerializeContext): string =>
	[header, ...rows.map(row => row.value)]
		.map(cells => cells.map(cell => plainTextInline(cell.value, context)).join(', '))
		.join('\n');

const serializeBlock = (block: Paragraph | Blocks, context: ISerializeContext): string => {
	switch (block.type) {
		case 'PARAGRAPH':
			return serializeParagraphValue(block.value, context) ?? '';
		case 'HEADING':
			return `${'#'.repeat(block.level)} ${serializeInline(block.value, context)}`;
		case 'QUOTE':
			return block.value
				.map(item => serializeParagraphValue(item.value, context) ?? '')
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
			const lines = block.value.map(line => line.value.value).join('\n');
			let fence = '```';
			while (lines.includes(fence)) {
				fence += '`';
			}
			return `${fence}\n${lines}\n${fence}`;
		}
		default:
			return '';
	}
};

const plainTextBlock = (block: Paragraph | Blocks, context: ISerializeContext): string => {
	switch (block.type) {
		case 'PARAGRAPH':
			return plainTextParagraphValue(block.value, context) ?? '';
		case 'HEADING':
			return plainTextInline(block.value, context);
		case 'QUOTE':
			return block.value.map(item => plainTextParagraphValue(item.value, context) ?? '').join('\n');
		case 'UNORDERED_LIST':
		case 'ORDERED_LIST':
		case 'TASKS':
			return plainTextList(block, context);
		case 'SPOILER_BLOCK':
			return block.value.map(paragraph => plainTextParagraphValue(paragraph.value, context) ?? '').join('\n');
		case 'TABLE':
			return plainTextTable(block, context);
		case 'CODE':
			return block.value.map(line => line.value.value).join('\n');
		default:
			return '';
	}
};

export const buildRenderSegments = (tokens: Root, context: ISerializeContext): TRenderSegment[] => {
	if (isBigEmojiOnly(tokens)) {
		const content = tokens[0].value.map(emojiBlock => serializeEmoji(emojiBlock, context)).join('');
		const accessibilityLabel = tokens[0].value.map(emojiBlock => emojiDisplayText(emojiBlock, context)).join(' ');
		return [{ type: 'markdown', content, accessibilityLabel }];
	}

	const segments: TRenderSegment[] = [];

	for (const block of tokens as Array<Paragraph | Blocks>) {
		if (block.type === 'KATEX') {
			const content = serializeMath(block.value, '$$');
			if (content) {
				segments.push({ type: 'markdown', content, accessibilityLabel: block.value });
			}
			continue;
		}

		if (block.type === 'LINE_BREAK') {
			segments.push({ type: 'linebreak' });
			continue;
		}

		const content = serializeBlock(block, context);
		if (content) {
			segments.push({ type: 'markdown', content, accessibilityLabel: plainTextBlock(block, context) });
		}
	}

	return segments;
};

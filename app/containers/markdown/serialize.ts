import type {
	Root,
	Paragraph,
	Blocks,
	Inlines,
	Emoji as EmojiBlock,
	Link as LinkBlock,
	Timestamp as TimestampBlock
} from '@rocket.chat/message-parser';

import dayjs from '~/lib/dayjs';
import { type IUserMention, type IUserChannel } from './interfaces';
import { type TGetCustomEmoji } from '~/definitions';

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

export type TRenderSegment =
	| { type: 'markdown'; content: string; accessibilityLabel: string }
	| { type: 'katex'; value: string }
	| { type: 'linebreak' };

const ESCAPE_PATTERN = /[\\`*_{}[\]()#+\-.!|~^$=<>]/g;

export const escapePlainText = (value: string): string => value.replace(ESCAPE_PATTERN, '\\$&');

const escapeUrl = (url: string): string => `<${url.replace(/\\/g, '\\\\').replace(/</g, '\\<').replace(/>/g, '\\>')}>`;

const timestampToUnixSeconds = (timestamp: string): number => {
	if (/^-?\d{10}$/.test(timestamp)) return Number(timestamp);
	if (/^-?\d{13}$/.test(timestamp)) return Math.floor(Number(timestamp) / 1000);
	return Math.floor(dayjs(timestamp).valueOf() / 1000);
};

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
			return dayjs(timestampMs).format('dddd, MMM DD, YYYY hh:mm A');
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

const resolveUserMentionLabel = (mention: string, ctx: ISerializeContext): IUserMentionLabel | null => {
	const found = ctx.mentions?.find(m => m && (m.username === mention || m.name === mention));
	if (!found) {
		return null;
	}

	const label = found.type === 'user' ? (ctx.useRealName && found.name ? found.name : found.username) : found.name;
	const itsMe = mention === ctx.username;
	const query = found.type === 'team' ? '?team=1' : itsMe ? '?me=1' : '';

	return { label: label ?? mention, rid: found._id, query };
};

const resolveChannelMentionLabel = (hashtag: string, ctx: ISerializeContext): string | null => {
	const found = ctx.channels?.find(channel => channel.name === hashtag);
	return found?._id ?? null;
};

const emojiDisplayText = (block: EmojiBlock, ctx: ISerializeContext): string => {
	if ('unicode' in block) {
		return block.unicode;
	}

	const emojiToken = `:${block.shortCode}:`;
	const emojiUnicode = ctx.formatShortnameToUnicode(emojiToken);
	const isAsciiEmoji = block.value.value !== block.shortCode;

	if (!ctx.convertAsciiEmoji && isAsciiEmoji) {
		return block.value.value;
	}

	return emojiUnicode;
};

const WORD_JOINER = '\u2060';

const serializeEmoji = (block: EmojiBlock, ctx: ISerializeContext): string => {
	const emojiName = 'unicode' in block ? '' : block.value.value.replace(/:/g, '');
	const customEmoji = 'unicode' in block ? null : ctx.getCustomEmoji(emojiName);
	if (customEmoji) {
		return `${WORD_JOINER}![](${ctx.baseUrl}/emoji-custom/${encodeURIComponent(customEmoji.name)}.${customEmoji.extension})`;
	}

	return escapePlainText(emojiDisplayText(block, ctx));
};

const serializeInlineCode = (value: { value: string }): string => {
	const text = value.value;
	const longestTickRun = Math.max(0, ...(text.match(/`+/g) ?? []).map(run => run.length));
	const fence = '`'.repeat(longestTickRun + 1);
	const padded = text.startsWith('`') || text.endsWith('`') ? ` ${text} ` : text;
	return `${fence}${padded}${fence}`;
};

const toLinkLabelValue = (label: LinkBlock['value']['label']): Inlines[] => (Array.isArray(label) ? label : [label]);

const serializeInline = (nodes: Inlines[], ctx: ISerializeContext): string =>
	nodes.map(node => serializeInlineNode(node, ctx)).join('');

const serializeInlineNode = (node: Inlines, ctx: ISerializeContext): string => {
	switch (node.type) {
		case 'PLAIN_TEXT':
			return escapePlainText(node.value);
		case 'BOLD':
			return `**${serializeInline(node.value, ctx)}**`;
		case 'ITALIC':
			return `_${serializeInline(node.value, ctx)}_`;
		case 'STRIKE':
			return `~~${serializeInline(node.value, ctx)}~~`;
		case 'LINK': {
			const label = serializeInline(toLinkLabelValue(node.value.label), ctx);
			if (!node.value.src.value) {
				return label;
			}
			return `[${label}](${escapeUrl(node.value.src.value)})`;
		}
		case 'MENTION_USER': {
			const mention = node.value.value;
			const prefix = ctx.mentionsWithAtSymbol ? '@' : '';
			if (mention === 'all' || mention === 'here') {
				return `[**${escapePlainText(prefix + mention)}**](${escapeUrl(`user://${mention}`)})`;
			}
			const resolved = resolveUserMentionLabel(mention, ctx);
			if (!resolved) {
				return escapePlainText(`@${mention}`);
			}
			return `[**${escapePlainText(prefix + resolved.label)}**](${escapeUrl(`user://${resolved.rid}${resolved.query}`)})`;
		}
		case 'MENTION_CHANNEL': {
			const hashtag = node.value.value;
			const prefix = ctx.roomsWithHashTagSymbol ? '#' : '';
			const rid = resolveChannelMentionLabel(hashtag, ctx);
			if (!rid) {
				return escapePlainText(`#${hashtag}`);
			}
			return `[**${escapePlainText(prefix + hashtag)}**](${escapeUrl(`channel://${rid}`)})`;
		}
		case 'EMOJI':
			return serializeEmoji(node, ctx);
		case 'INLINE_CODE':
			return serializeInlineCode(node.value);
		case 'INLINE_KATEX':
			return `$${node.value}$`;
		case 'TIMESTAMP': {
			const label = formatTimestampLabel(node.value);
			const unixSeconds = timestampToUnixSeconds(node.value.timestamp);
			return `[${escapePlainText(` ${label} `)}](${escapeUrl(`timestamp://${unixSeconds}`)})`;
		}
		case 'IMAGE':
			return `![](${escapeUrl(node.value.src.value)})`;
		default:
			return '';
	}
};

const plainTextInline = (nodes: Inlines[], ctx: ISerializeContext): string =>
	nodes.map(node => plainTextNode(node, ctx)).join('');

const plainTextNode = (node: Inlines, ctx: ISerializeContext): string => {
	switch (node.type) {
		case 'PLAIN_TEXT':
			return node.value;
		case 'BOLD':
		case 'ITALIC':
		case 'STRIKE':
			return plainTextInline(node.value, ctx);
		case 'LINK':
			return plainTextInline(toLinkLabelValue(node.value.label), ctx);
		case 'MENTION_USER': {
			const mention = node.value.value;
			const prefix = ctx.mentionsWithAtSymbol ? '@' : '';
			if (mention === 'all' || mention === 'here') {
				return prefix + mention;
			}
			const resolved = resolveUserMentionLabel(mention, ctx);
			return resolved ? prefix + resolved.label : `@${mention}`;
		}
		case 'MENTION_CHANNEL': {
			const hashtag = node.value.value;
			const prefix = ctx.roomsWithHashTagSymbol ? '#' : '';
			const rid = resolveChannelMentionLabel(hashtag, ctx);
			return rid ? prefix + hashtag : `#${hashtag}`;
		}
		case 'EMOJI':
			return emojiDisplayText(node, ctx);
		case 'INLINE_CODE':
			return node.value.value;
		case 'INLINE_KATEX':
			return node.value;
		case 'TIMESTAMP':
			return formatTimestampLabel(node.value);
		case 'IMAGE':
			return '';
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

const serializeParagraphValue = (value: Paragraph['value'], ctx: ISerializeContext): string | null => {
	const nodes = resolveParagraphNodes(value);
	return nodes ? serializeInline(nodes, ctx) : null;
};

const plainTextParagraphValue = (value: Paragraph['value'], ctx: ISerializeContext): string | null => {
	const nodes = resolveParagraphNodes(value);
	return nodes ? plainTextInline(nodes, ctx) : null;
};

const serializeBlock = (block: Paragraph | Blocks, ctx: ISerializeContext): string => {
	switch (block.type) {
		case 'PARAGRAPH':
			return serializeParagraphValue(block.value, ctx) ?? '';
		case 'HEADING':
			return `${'#'.repeat(block.level)} ${serializeInline(block.value, ctx)}`;
		case 'QUOTE':
			return block.value
				.map(item => serializeParagraphValue(item.value, ctx) ?? '')
				.map(line => `> ${line}`)
				.join('\n>\n');
		case 'UNORDERED_LIST':
			return block.value.map(item => `- ${serializeInline(item.value, ctx)}`).join('\n');
		case 'ORDERED_LIST':
			return block.value.map(item => `${item.number}. ${serializeInline(item.value, ctx)}`).join('\n');
		case 'TASKS':
			return block.value.map(item => `- [${item.status ? 'x' : ' '}] ${serializeInline(item.value, ctx)}`).join('\n');
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

const plainTextBlock = (block: Paragraph | Blocks, ctx: ISerializeContext): string => {
	switch (block.type) {
		case 'PARAGRAPH':
			return plainTextParagraphValue(block.value, ctx) ?? '';
		case 'HEADING':
			return plainTextInline(block.value, ctx);
		case 'QUOTE':
			return block.value.map(item => plainTextParagraphValue(item.value, ctx) ?? '').join('\n');
		case 'UNORDERED_LIST':
		case 'ORDERED_LIST':
			return block.value.map(item => plainTextInline(item.value, ctx)).join('\n');
		case 'TASKS':
			return block.value.map(item => plainTextInline(item.value, ctx)).join('\n');
		case 'CODE':
			return block.value.map(line => line.value.value).join('\n');
		default:
			return '';
	}
};

export const buildRenderSegments = (tokens: Root, ctx: ISerializeContext): TRenderSegment[] => {
	if (tokens.length === 1 && tokens[0].type === 'BIG_EMOJI') {
		const content = tokens[0].value.map(emojiBlock => serializeEmoji(emojiBlock, ctx)).join('');
		const accessibilityLabel = tokens[0].value.map(emojiBlock => emojiDisplayText(emojiBlock, ctx)).join(' ');
		return [{ type: 'markdown', content, accessibilityLabel }];
	}

	const segments: TRenderSegment[] = [];

	for (const block of tokens as Array<Paragraph | Blocks>) {
		if (block.type === 'KATEX') {
			segments.push({ type: 'katex', value: block.value });
			continue;
		}

		if (block.type === 'LINE_BREAK') {
			segments.push({ type: 'linebreak' });
			continue;
		}

		const content = serializeBlock(block, ctx);
		if (content) {
			segments.push({ type: 'markdown', content, accessibilityLabel: plainTextBlock(block, ctx) });
		}
	}

	return segments;
};

import type {
	Root,
	BigEmoji,
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
import { CHANNEL_SCHEME, ME_QUERY, TEAM_QUERY, TIMESTAMP_FULL_FORMAT, TIMESTAMP_SCHEME, USER_SCHEME } from './linkSchemes';

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

export const escapePlainText = (value: string): string => value.replace(ESCAPE_PATTERN, '\\$&');

const escapeUrl = (url: string): string => `<${url.replace(/\\/g, '\\\\').replace(/</g, '\\<').replace(/>/g, '\\>')}>`;

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

const toLinkLabelValue = (label: LinkBlock['value']['label']): Inlines[] => (Array.isArray(label) ? label : [label]);

const serializeInline = (nodes: Inlines[], context: ISerializeContext): string =>
	nodes.map(node => serializeInlineNode(node, context)).join('');

const serializeInlineNode = (node: Inlines, context: ISerializeContext): string => {
	switch (node.type) {
		case 'PLAIN_TEXT':
			return escapePlainText(node.value);
		case 'BOLD':
			return `**${serializeInline(node.value, context)}**`;
		case 'ITALIC':
			return `_${serializeInline(node.value, context)}_`;
		case 'STRIKE':
			return `~~${serializeInline(node.value, context)}~~`;
		case 'LINK': {
			const label = serializeInline(toLinkLabelValue(node.value.label), context);
			if (!node.value.src.value) {
				return label;
			}
			return `[${label}](${escapeUrl(node.value.src.value)})`;
		}
		case 'MENTION_USER':
			return serializeMention(resolveUserMention(node.value.value, context));
		case 'MENTION_CHANNEL':
			return serializeMention(resolveChannelMention(node.value.value, context));
		case 'EMOJI':
			return serializeEmoji(node, context);
		case 'INLINE_CODE':
			return serializeInlineCode(node.value);
		case 'INLINE_KATEX':
			return `$${node.value}$`;
		case 'TIMESTAMP': {
			const label = formatTimestampLabel(node.value);
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
	return nodes ? serializeInline(nodes, context) : null;
};

const plainTextParagraphValue = (value: Paragraph['value'], context: ISerializeContext): string | null => {
	const nodes = resolveParagraphNodes(value);
	return nodes ? plainTextInline(nodes, context) : null;
};

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
				.join('\n>\n');
		case 'UNORDERED_LIST':
			return block.value.map(item => `- ${serializeInline(item.value, context)}`).join('\n');
		case 'ORDERED_LIST':
			return block.value.map(item => `${item.number}. ${serializeInline(item.value, context)}`).join('\n');
		case 'TASKS':
			return block.value.map(item => `- [${item.status ? 'x' : ' '}] ${serializeInline(item.value, context)}`).join('\n');
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
			return block.value.map(item => plainTextInline(item.value, context)).join('\n');
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
			segments.push({ type: 'markdown', content: `$$\n${block.value}\n$$`, accessibilityLabel: block.value });
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

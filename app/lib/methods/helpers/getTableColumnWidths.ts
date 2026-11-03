import clamp from 'lodash/clamp';
import { type Inlines, type Table, type Timestamp } from '@rocket.chat/message-parser';

const CHAR_WIDTH = 9;
const CELL_PADDING = 16;
const EMOJI_LENGTH = 2;
const TIMESTAMP_LENGTHS: Record<Timestamp['value']['format'], number> = { t: 10, T: 13, d: 12, D: 25, f: 34, F: 37, R: 19 };
const WIDE_CHARACTER = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/g;
const MIN_COLUMN_WIDTH = 80;
const MAX_COLUMN_WIDTH = 240;

const getTextLength = (text: string): number => text.length + (text.match(WIDE_CHARACTER)?.length ?? 0);

const getInlineLength = (nodes: Inlines[]): number => nodes.reduce((total, node) => total + getNodeLength(node), 0);

const getNodeLength = (node: Inlines): number => {
	switch (node.type) {
		case 'INLINE_KATEX':
		case 'PLAIN_TEXT':
			return getTextLength(node.value);
		case 'BOLD':
		case 'ITALIC':
		case 'STRIKE':
			return getInlineLength(node.value);
		case 'LINK':
			return getInlineLength(Array.isArray(node.value.label) ? node.value.label : [node.value.label]);
		case 'INLINE_CODE':
			return getNodeLength(node.value);
		case 'MENTION_USER':
		case 'MENTION_CHANNEL':
			return getNodeLength(node.value) + 1;
		case 'EMOJI':
			return EMOJI_LENGTH;
		case 'TIMESTAMP':
			return TIMESTAMP_LENGTHS[node.value.format];
		default:
			return 0;
	}
};

export const getTableColumnWidths = ({ header, rows }: Table['value']): number[] =>
	header.map((headerCell, index) => {
		const longest = Math.max(getInlineLength(headerCell.value), ...rows.map(row => getInlineLength(row.value[index].value)));
		return clamp(longest * CHAR_WIDTH + CELL_PADDING, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
	});

import clamp from 'lodash/clamp';
import { type Inlines, type Table } from '@rocket.chat/message-parser';

const CHAR_WIDTH = 9;
const CELL_PADDING = 16;
const EMOJI_LENGTH = 2;
const TIMESTAMP_LENGTH = 10;
const MIN_COLUMN_WIDTH = 80;
const MAX_COLUMN_WIDTH = 240;

const getInlineLength = (nodes: Inlines[]): number => nodes.reduce((total, node) => total + getNodeLength(node), 0);

const getNodeLength = (node: Inlines): number => {
	switch (node.type) {
		case 'PLAIN_TEXT':
			return node.value.length;
		case 'BOLD':
		case 'ITALIC':
		case 'STRIKE':
			return getInlineLength(node.value);
		case 'LINK':
			return getInlineLength(Array.isArray(node.value.label) ? node.value.label : [node.value.label]);
		case 'INLINE_CODE':
			return node.value.value.length;
		case 'MENTION_USER':
		case 'MENTION_CHANNEL':
			return node.value.value.length + 1;
		case 'EMOJI':
			return EMOJI_LENGTH;
		case 'TIMESTAMP':
			return TIMESTAMP_LENGTH;
		default:
			return 0;
	}
};

export const getTableColumnWidths = ({ header, rows }: Table['value']): number[] =>
	header.map((headerCell, index) => {
		const longest = Math.max(getInlineLength(headerCell.value), ...rows.map(row => getInlineLength(row.value[index].value)));
		return clamp(longest * CHAR_WIDTH + CELL_PADDING, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
	});

import { parse } from '@rocket.chat/message-parser';

import { getTableColumnWidths } from '../getTableColumnWidths';

const MIN_WIDTH = 80;
const MAX_WIDTH = 240;
const TEN_CHARACTERS_WIDTH = 106;

const getWidths = (lines: string[]): number[] => {
	const [block] = parse(lines.join('\n'));
	if (block.type !== 'TABLE') {
		throw new Error('not a table');
	}
	return getTableColumnWidths(block.value);
};

describe('getTableColumnWidths', () => {
	it('keeps short columns at the minimum width', () => {
		expect(getWidths(['| a | b |', '| - | - |', '| 1 | 2 |'])).toEqual([MIN_WIDTH, MIN_WIDTH]);
	});

	it('caps very long columns at the maximum width', () => {
		expect(getWidths([`| ${'x'.repeat(200)} |`, '| - |', '| 1 |'])).toEqual([MAX_WIDTH]);
	});

	it('sizes each column by its longest cell across the header and body rows', () => {
		const [first, second, third] = getWidths([`| ${'h'.repeat(12)} | b | c |`, '| - | - | - |', `| x | ${'y'.repeat(20)} | z |`]);

		expect(first).toBeGreaterThan(MIN_WIDTH);
		expect(second).toBeGreaterThan(first);
		expect(third).toBe(MIN_WIDTH);
	});

	it('measures the visible text of nested inline markup, not its syntax', () => {
		const text = 'a'.repeat(14);
		const [plain, bold, link] = getWidths([`| ${text} | **${text}** | [${text}](https://rocket.chat) |`, '| - | - | - |']);

		expect(bold).toBe(plain);
		expect(link).toBe(plain);
	});

	it.each([
		['italic', '_aaaaaaaaaa_', TEN_CHARACTERS_WIDTH],
		['strike', '~aaaaaaaaaa~', TEN_CHARACTERS_WIDTH],
		['inline code', '`aaaaaaaaaa`', TEN_CHARACTERS_WIDTH],
		['user mention', '@aaaaaaaaa', TEN_CHARACTERS_WIDTH],
		['channel mention', '#aaaaaaaaa', TEN_CHARACTERS_WIDTH],
		['emoji', ':smile: aaaaaaa', TEN_CHARACTERS_WIDTH],
		['timestamp', '<t:1735689600:t>', TEN_CHARACTERS_WIDTH]
	])('counts %s content towards the column width', (_name, cell, expected) => {
		expect(getWidths(['| h |', '| - |', `| ${cell} |`])).toEqual([expected]);
	});
});

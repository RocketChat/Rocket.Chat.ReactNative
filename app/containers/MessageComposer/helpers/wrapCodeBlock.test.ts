import { wrapCodeBlock } from './wrapCodeBlock';

describe('wrapCodeBlock', () => {
	it('inserts an empty fenced block with the cursor on the middle line', () => {
		expect(wrapCodeBlock('', 0, 0)).toEqual({
			updatedText: '```\n\n```',
			selection: { start: 4, end: 4 }
		});
	});

	it('adds a leading newline when the cursor is not at the start of a line', () => {
		expect(wrapCodeBlock('comment', 7, 7)).toEqual({
			updatedText: 'comment\n```\n\n```',
			selection: { start: 12, end: 12 }
		});
	});

	it('does not add a leading newline when already at the start of a line', () => {
		expect(wrapCodeBlock('comment\n', 8, 8)).toEqual({
			updatedText: 'comment\n```\n\n```',
			selection: { start: 12, end: 12 }
		});
	});

	it('wraps the selected text inside the block and keeps it selected', () => {
		expect(wrapCodeBlock('comment\nfoo', 8, 11)).toEqual({
			updatedText: 'comment\n```\nfoo\n```',
			selection: { start: 12, end: 15 }
		});
	});

	it('adds a trailing newline so the closing fence stays on its own line', () => {
		expect(wrapCodeBlock('abc', 0, 0)).toEqual({
			updatedText: '```\n\n```\nabc',
			selection: { start: 4, end: 4 }
		});
	});
});

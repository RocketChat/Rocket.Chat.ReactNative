import { closeUnclosedCodeBlock } from '../closeUnclosedCodeBlock';

describe('closeUnclosedCodeBlock', () => {
	it('appends a closing fence when a code block is left open', () => {
		expect(closeUnclosedCodeBlock('```js\nconst a = 1;')).toBe('```js\nconst a = 1;\n```');
	});

	it('leaves a balanced code block untouched', () => {
		const text = '```js\nconst a = 1;\n```';
		expect(closeUnclosedCodeBlock(text)).toBe(text);
	});

	it('leaves text without fences untouched', () => {
		expect(closeUnclosedCodeBlock('hello world')).toBe('hello world');
		expect(closeUnclosedCodeBlock('')).toBe('');
	});

	it('closes the last block when an earlier one is balanced', () => {
		expect(closeUnclosedCodeBlock('```a```\n```b')).toBe('```a```\n```b\n```');
	});

	it('does not count inline single or double backticks as fences', () => {
		expect(closeUnclosedCodeBlock('use `code` and ``x``')).toBe('use `code` and ``x``');
	});

	it('does not append when the backtick run is longer than a fence', () => {
		expect(closeUnclosedCodeBlock('````\ntest')).toBe('````\ntest');
		expect(closeUnclosedCodeBlock('`````\ntest')).toBe('`````\ntest');
	});

	it('still closes an open fence when a longer backtick run appears elsewhere', () => {
		expect(closeUnclosedCodeBlock('```\n````')).toBe('```\n````\n```');
	});
});

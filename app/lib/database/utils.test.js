/* eslint-disable no-undef */
import * as utils from './utils';

describe('sanitizeLikeStringTester', () => {
	// example chars that shouldn't return
	const disallowedChars = ',./;[]!@#$%^&*()_-=+~';
	const sanitizeLikeStringTester = str => expect(utils.sanitizeLikeString(`${ str }${ disallowedChars }`)).toBe(`${ str }${ '_'.repeat(disallowedChars.length) }`);

	test('render empty', () => {
		expect(utils.sanitizeLikeString(null)).toBe(undefined);
		expect(utils.sanitizeLikeString('')).toBe('');
		expect(utils.sanitizeLikeString(undefined)).toBe(undefined);
	});

	// Testing a couple of different alphabets
	test('render test (latin)', () => {
		sanitizeLikeStringTester('test123');
	});

	test('render test (arabic)', () => {
		sanitizeLikeStringTester('اختبار123');
	});

	test('render test (russian)', () => {
		sanitizeLikeStringTester('тест123');
	});

	test('render test (chinese trad)', () => {
		sanitizeLikeStringTester('測試123');
	});

	test('render test (japanese)', () => {
		sanitizeLikeStringTester('テスト123');
	});
});

describe('sanitizer', () => {
	test('render the same result', () => {
		const content = { a: true };
		expect(utils.sanitizer(content)).toBe(content);
	});
});

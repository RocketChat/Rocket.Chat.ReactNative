import * as utils from './utils';

describe('sanitizeLikeStringTester', () => {
	// example chars that shouldn't return
	const disallowedChars = ',./;[]!@#$%^&*()_-=+~';

	test('render empty', () => {
		expect(utils.sanitizeLikeString('')).toBe('');
		expect(utils.sanitizeLikeString(undefined)).toBe(undefined);
	});

	// Testing a couple of different alphabets
	test.each([
		['latin', 'test123'],
		['arabic', 'اختبار123'],
		['russian', 'тест123'],
		['chineseTrad', '測試123'],
		['japanese', 'テスト123']
	])('render test (%s)', (_, str) => {
		expect(utils.sanitizeLikeString(`${str}${disallowedChars}`)).toBe(`${str}${'_'.repeat(disallowedChars.length)}`);
	});
});

describe('sanitizer', () => {
	test('render the same result', () => {
		const content = { a: true };
		expect(utils.sanitizer(content)).toBe(content);
	});
});

describe('slugifyLikeString', () => {
	test('render empty', () => {
		expect(utils.slugifyLikeString('')).toBe('');
		expect(utils.slugifyLikeString(undefined)).toBe('');
	});
	test('slugify the latin alphabet', () => {
		expect(utils.slugifyLikeString('test123')).toBe('test123');
		expect(utils.slugifyLikeString('TEST123')).toBe('test123');
	});
	test('slugify the russian alphabet', () => {
		const textToSlugify = 'ПРОВЕРКА';
		const textSlugified = 'proverka';
		expect(utils.slugifyLikeString(textToSlugify)).toBe(textSlugified);
	});
	test('slugify the arabic alphabet', () => {
		const textToSlugify = 'اختبار123';
		const textSlugified = 'khtbr123';
		expect(utils.slugifyLikeString(textToSlugify)).toBe(textSlugified);
	});
	test('slugify the chinese trad alphabet', () => {
		const textToSlugify = '測試123';
		const textSlugified = 'ce-shi-123';
		expect(utils.slugifyLikeString(textToSlugify)).toBe(textSlugified);
	});
	test('slugify the japanese alphabet', () => {
		const textToSlugify = 'テスト123';
		const textSlugified = 'tesuto123';
		expect(utils.slugifyLikeString(textToSlugify)).toBe(textSlugified);
	});
});

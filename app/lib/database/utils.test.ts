import type { Q } from '@nozbe/watermelondb';

import * as utils from './utils';

// Extracts every `LIKE` value (e.g. '%moy%') present in a serialized Q.or clause
const getLikeValues = (clause: Q.Or): string[] =>
	(clause as any).conditions.map((condition: any) => condition.comparison.right.value);

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

describe('getSubscriptionSearchClause', () => {
	const columnsOf = (clause: Q.Or): string[] => (clause as any).conditions.map((condition: any) => condition.left);

	test('queries the slugified and sanitized name/fname columns', () => {
		const clause = utils.getSubscriptionSearchClause('test');
		expect((clause as any).type).toBe('or');
		expect(columnsOf(clause)).toEqual(['sanitized_fname', 'name', 'name', 'fname']);
		expect(getLikeValues(clause)).toEqual(['%test%', '%test%', '%test%', '%test%']);
	});

	// The actual bug: SQLite LIKE is case-sensitive for Cyrillic, so the search must rely on the
	// slugified (lower latin) value. Upper and lower case input must produce the same slugified clause.
	test('produces the same slugified clause regardless of Cyrillic case', () => {
		const upper = getLikeValues(utils.getSubscriptionSearchClause('М'));
		const lower = getLikeValues(utils.getSubscriptionSearchClause('м'));
		// the slugified clauses (sanitized_fname + name) match case-insensitively
		expect(upper[0]).toBe('%m%');
		expect(lower[0]).toBe('%m%');
		expect(upper[0]).toBe(lower[0]);
		expect(upper[1]).toBe(lower[1]);
	});

	test('slugifies a multi-word Cyrillic name so a lowercase query matches an uppercase channel', () => {
		// channel named 'Мой Канал' would be stored slugified as 'moy-kanal'
		const clause = utils.getSubscriptionSearchClause('Мой');
		const [slugifiedFname] = getLikeValues(clause);
		expect(slugifiedFname).toBe('%moy%');
		expect('moy-kanal').toContain(slugifiedFname.replace(/%/g, ''));
	});

	test('keeps the sanitized (non-slugified) fallback for the original characters', () => {
		const clause = utils.getSubscriptionSearchClause('тест');
		const values = getLikeValues(clause);
		// slugified clauses transliterate to latin...
		expect(values[0]).toBe('%test%');
		expect(values[1]).toBe('%test%');
		// ...while the fallback clauses keep the original Cyrillic for not-yet-slugified rows
		expect(values[2]).toBe('%тест%');
		expect(values[3]).toBe('%тест%');
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

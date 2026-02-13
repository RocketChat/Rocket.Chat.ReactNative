import { getMentionRegexp } from './getMentionRegexp';

const regexp = getMentionRegexp();

describe('getMentionRegexpUser', function () {
	test('removing query text on user suggestion autocomplete (latin)', () => {
		const message = 'Hey @test123';
		expect(message.replace(regexp, '')).toBe('Hey @');
	});

	test('removing query text on user suggestion autocomplete (arabic)', () => {
		const message = 'Hey @اختبار123';
		expect(message.replace(regexp, '')).toBe('Hey @');
	});

	test('removing query text on user suggestion autocomplete (russian)', () => {
		const message = 'Hey @тест123';
		expect(message.replace(regexp, '')).toBe('Hey @');
	});

	test('removing query text on user suggestion autocomplete (chinese trad)', () => {
		const message = 'Hey @測試123';
		expect(message.replace(regexp, '')).toBe('Hey @');
	});

	test('removing query text on user suggestion autocomplete (japanese)', () => {
		const message = 'Hey @テスト123';
		expect(message.replace(regexp, '')).toBe('Hey @');
	});

	test('removing query text on user suggestion autocomplete (special characters in query)', () => {
		const message = "Hey @'=test123";
		expect(message.replace(regexp, '')).toBe('Hey @');
	});
});

describe('getMentionRegexpEmoji', function () {
	test('removing query text on emoji suggestion autocomplete', () => {
		const message = 'Hey :smiley';
		expect(message.replace(regexp, '')).toBe('Hey :');
	});
});

describe('getMentionRegexpCommand', function () {
	test('removing query text on slash command suggestion autocomplete', () => {
		const message = '/archive';
		expect(message.replace(regexp, '')).toBe('/');
	});
});

describe('getMentionRegexpRoom', function () {
	test('removing query text on channel suggestion autocomplete', () => {
		const message = 'Check #general';
		expect(message.replace(regexp, '')).toBe('Check #');
	});
});

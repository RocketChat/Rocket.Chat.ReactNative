import getRegexp from './getRegexp';

describe('getRegexpMentionUser', function () {
	const trackingType = '@'; // Tracking type for mentioning users
	const regexp = getRegexp(trackingType);

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
		const message = 'Hey @\'=test123';
		expect(message.replace(regexp, '')).toBe('Hey @');
	});
});

describe('getRegexpMentionEmoji', function () {
	const trackingType = ':'; // Tracking type for mentioning emojis
	const regexp = getRegexp(trackingType);

	test('removing query text on emoji suggestion autocomplete ', () => {
		const message = 'Hey :smiley';
		expect(message.replace(regexp, '')).toBe('Hey :');
	});
});

describe('getRegexpMentionCommand', function () {
	const trackingType = '/'; // Tracking type for mentioning commands
	const regexp = getRegexp(trackingType);

	test('removing query text on emoji suggestion autocomplete ', () => {
		const message = '/archive';
		expect(message.replace(regexp, '')).toBe('/');
	});
});

describe('getRegexpMentionRoom', function () {
	const trackingType = '#'; // Tracking type for mentioning rooms
	const regexp = getRegexp(trackingType);

	test('removing query text on emoji suggestion autocomplete ', () => {
		const message = 'Check #general';
		expect(message.replace(regexp, '')).toBe('Check #');
	});
});

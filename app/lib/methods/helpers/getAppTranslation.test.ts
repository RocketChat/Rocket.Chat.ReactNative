import { getAppTranslation, stripAppKeyPrefix } from './getAppTranslation';

const dictionaries = {
	en: { greeting: 'Hello', welcome: 'Welcome, {{name}}!', count: 'You have {{n}} items' },
	'pt-br': { greeting: 'Olá' },
	pt: { greeting: 'Olá (pt)', farewell: 'Adeus' }
};

describe('getAppTranslation', () => {
	it('returns the translation for an exact language match', () => {
		expect(getAppTranslation(dictionaries, 'pt-BR', 'greeting')).toBe('Olá');
	});

	it('normalizes underscores and casing in the language tag', () => {
		expect(getAppTranslation(dictionaries, 'PT_br', 'greeting')).toBe('Olá');
	});

	it('falls back to the base language when the region variant is missing', () => {
		expect(getAppTranslation(dictionaries, 'pt-BR', 'farewell')).toBe('Adeus');
	});

	it('falls back to english when neither the variant nor the base language has the key', () => {
		expect(getAppTranslation(dictionaries, 'pt-BR', 'welcome', { name: 'Bob' })).toBe('Welcome, Bob!');
	});

	it('defaults to english when no language is given', () => {
		expect(getAppTranslation(dictionaries, undefined, 'greeting')).toBe('Hello');
	});

	it('interpolates {{args}} including numbers', () => {
		expect(getAppTranslation(dictionaries, 'en', 'count', { n: 3 })).toBe('You have 3 items');
	});

	it('leaves unknown placeholders untouched', () => {
		expect(getAppTranslation(dictionaries, 'en', 'welcome', { other: 'x' })).toBe('Welcome, {{name}}!');
	});

	it('returns undefined when the key is missing', () => {
		expect(getAppTranslation(dictionaries, 'en', 'nope')).toBeUndefined();
	});

	it('returns undefined when there is no dictionary', () => {
		expect(getAppTranslation(undefined, 'en', 'greeting')).toBeUndefined();
	});

	it('returns undefined for an empty key', () => {
		expect(getAppTranslation(dictionaries, 'en', '')).toBeUndefined();
	});
});

describe('stripAppKeyPrefix', () => {
	// Confirmed against a live commands.list response: for appId
	// 'c33fa1a6-68a7-491e-bf49-9d7b99671c48', the server sends
	// description: "app-c33fa1a6-68a7-491e-bf49-9d7b99671c48.cmd_description", while the
	// matching apps/languages entry stores the bare key: languages.en.cmd_description.
	const appId = 'c33fa1a6-68a7-491e-bf49-9d7b99671c48';

	it('strips the "app-<appId>." placeholder prefix apps-engine sends', () => {
		expect(stripAppKeyPrefix(`app-${appId}.cmd_description`, appId)).toBe('cmd_description');
	});

	it('strips a bare "<appId>." prefix too', () => {
		expect(stripAppKeyPrefix(`${appId}.cmd_description`, appId)).toBe('cmd_description');
	});

	it('leaves the key untouched when it has no matching prefix', () => {
		expect(stripAppKeyPrefix('cmd_description', appId)).toBe('cmd_description');
		expect(stripAppKeyPrefix('app-some-other-app.cmd_description', appId)).toBe('app-some-other-app.cmd_description');
	});

	it('leaves the key untouched without an appId', () => {
		expect(stripAppKeyPrefix(`app-${appId}.cmd_description`)).toBe(`app-${appId}.cmd_description`);
	});
});

describe('getAppTranslation with a real apps/languages payload shape', () => {
	// Real payload observed for a Rocket.Chat marketplace app (Polls).
	const dictionaries = {
		en: { cmd_description: 'Create a simple poll' }
	};

	it('resolves once the app-key prefix has been stripped by the caller', () => {
		const appId = 'c33fa1a6-68a7-491e-bf49-9d7b99671c48';
		const key = stripAppKeyPrefix(`app-${appId}.cmd_description`, appId);
		expect(getAppTranslation(dictionaries, 'en', key)).toBe('Create a simple poll');
	});
});

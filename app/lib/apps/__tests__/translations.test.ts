import { type TAppTranslations } from '../appsStore';
import { translateAppKey } from '../translations';

const translations: TAppTranslations = {
	'app-id': {
		en: { greeting: 'Summarize' },
		'pt-BR': { greeting: 'Resumir' },
		pt: { greeting: 'Resumo' }
	}
};

describe('translateAppKey', () => {
	test('uses the exact locale when the app ships it', () => {
		expect(translateAppKey({ appId: 'app-id', key: 'greeting', translations, locale: 'pt-BR' })).toBe('Resumir');
	});

	test('matches a locale the app spells differently', () => {
		expect(translateAppKey({ appId: 'app-id', key: 'greeting', translations, locale: 'pt_br' })).toBe('Resumir');
	});

	test('falls back to the base language', () => {
		expect(translateAppKey({ appId: 'app-id', key: 'greeting', translations, locale: 'pt-PT' })).toBe('Resumo');
	});

	test('falls back to english for an unshipped language', () => {
		expect(translateAppKey({ appId: 'app-id', key: 'greeting', translations, locale: 'ja' })).toBe('Summarize');
	});

	test('falls back to the raw key for an unknown app or key', () => {
		expect(translateAppKey({ appId: 'other-app', key: 'greeting', translations, locale: 'en' })).toBe('greeting');
		expect(translateAppKey({ appId: 'app-id', key: 'missing', translations, locale: 'en' })).toBe('missing');
	});
});

const localeKeys = {
	en: 'en',
	ar: 'ar',
	de: 'de',
	'es-ES': 'es',
	fi: 'fi',
	fr: 'fr',
	it: 'it',
	ja: 'ja',
	nl: 'nl',
	'pt-BR': 'pt-br',
	'pt-PT': 'pt',
	ru: 'ru',
	'sl-SI': 'sl',
	sv: 'sv',
	tr: 'tr',
	'zh-CN': 'zh-cn',
	'zh-TW': 'zh-tw',
	no: 'nb'
} satisfies Record<string, string>;

type TLocaleKey = keyof typeof localeKeys;

const isLocaleKey = (locale: string): locale is TLocaleKey => locale in localeKeys;

export const toDayJsLocale = (locale: string): string => (isLocaleKey(locale) ? localeKeys[locale] : locale);

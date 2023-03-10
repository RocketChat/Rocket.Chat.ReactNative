const localeKeys: { [key: string]: string } = {
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
	'zh-TW': 'zh-tw'
};

export const toMomentLocale = (locale: string): string => localeKeys[locale];

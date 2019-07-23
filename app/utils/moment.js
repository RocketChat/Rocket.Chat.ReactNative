const localeKeys = {
	en: 'en',
	ru: 'ru',
	'pt-BR': 'pt-br',
	'zh-CN': 'zh-cn',
	fr: 'fr',
	de: 'de',
	'pt-PT': 'pt'
};

export const toMomentLocale = locale => localeKeys[locale];

const localeKeys: { [key: string]: string } = {
	'es-ES': 'es',
	'pt-BR': 'pt-br',
	'pt-PT': 'pt',
	'sl-SI': 'sl',
	'zh-CN': 'zh-cn',
	'zh-TW': 'zh-tw',
};

export const toMomentLocale = (locale: string): string => localeKeys[locale] || locale;

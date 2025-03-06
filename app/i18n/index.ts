import i18n from 'i18n-js';
import { I18nManager } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import moment from 'moment';
import 'moment/min/locales';

import { toMomentLocale } from './moment';
import { isRTL } from './isRTL';
import englishJson from './locales/en.json';

type TTranslatedKeys = keyof typeof englishJson;

export { isRTL };

interface ILanguage {
	label: string;
	value: string;
	file: () => any;
}

export const LANGUAGES: ILanguage[] = [
	{
		label: 'English',
		value: 'en',
		file: () => require('./locales/en.json')
	},
	{
		label: 'العربية',
		value: 'ar',
		file: () => require('./locales/ar.json')
	},
	{
		label: 'বাংলা',
		value: 'bn',
		file: () => require('./locales/bn-IN.json')
	},
	{
		label: 'Czech',
		value: 'cs',
		file: () => require('./locales/cs.json')
	},
	{
		label: 'Deutsch',
		value: 'de',
		file: () => require('./locales/de.json')
	},
	{
		label: 'Español',
		value: 'es',
		file: () => require('./locales/es.json')
	},
	{
		label: 'Finnish',
		value: 'fi',
		file: () => require('./locales/fi.json')
	},
	{
		label: 'Français',
		value: 'fr',
		file: () => require('./locales/fr.json')
	},
	{
		label: 'हिन्दी',
		value: 'hi',
		file: () => require('./locales/hi-IN.json')
	},

	{
		label: 'Hungarian',
		value: 'hu',
		file: () => require('./locales/hu.json')
	},

	{
		label: 'Italiano',
		value: 'it',
		file: () => require('./locales/it.json')
	},
	{
		label: '日本語',
		value: 'ja',
		file: () => require('./locales/ja.json')
	},
	{
		label: 'Nederlands',
		value: 'nl',
		file: () => require('./locales/nl.json')
	},
	{
		label: 'Português (BR)',
		value: 'pt-BR',
		file: () => require('./locales/pt-BR.json')
	},
	{
		label: 'Português (PT)',
		value: 'pt-PT',
		file: () => require('./locales/pt-PT.json')
	},
	{
		label: 'Russian',
		value: 'ru',
		file: () => require('./locales/ru.json')
	},
	{
		label: 'Slovenian (Slovenia)',
		value: 'sl-SI',
		file: () => require('./locales/sl-SI.json')
	},
	{
		label: 'Swedish',
		value: 'sv',
		file: () => require('./locales/sv.json')
	},
	{
		label: 'தமிழ்',
		value: 'ta',
		file: () => require('./locales/ta-IN.json')
	},
	{
		label: 'తెలుగు',
		value: 'te',
		file: () => require('./locales/te-IN.json')
	},
	{
		label: 'Türkçe',
		value: 'tr',
		file: () => require('./locales/tr.json')
	},
	{
		label: '简体中文',
		value: 'zh-CN',
		file: () => require('./locales/zh-CN.json')
	},
	{
		label: '繁體中文',
		value: 'zh-TW',
		file: () => require('./locales/zh-TW.json')
	}
];

interface ITranslations {
	[language: string]: () => typeof englishJson;
}

const translations = LANGUAGES.reduce((ret, item) => {
	ret[item.value] = item.file;
	return ret;
}, {} as ITranslations);

export const setLanguage = (l: string) => {
	if (!l) {
		return;
	}
	// server uses lowercase pattern (pt-br), but we're forced to use standard pattern (pt-BR)
	let locale = LANGUAGES.find(ll => ll.value.toLowerCase() === l.toLowerCase())?.value;
	if (!locale) {
		locale = 'en';
	}
	// don't go forward if it's the same language and default language (en) was setup already
	if (i18n.locale === locale && i18n.translations?.en) {
		return;
	}
	i18n.locale = locale;
	i18n.translations = { ...i18n.translations, [locale]: translations[locale]?.() };
	I18nManager.forceRTL(isRTL(locale));
	I18nManager.swapLeftAndRightInRTL(isRTL(locale));
	// TODO: Review this logic
	// @ts-ignore
	i18n.isRTL = I18nManager.isRTL;
	moment.locale(toMomentLocale(locale));
};

i18n.translations = { en: translations.en?.() };
const defaultLanguage = { languageTag: 'en', isRTL: false };
const availableLanguages = Object.keys(translations);
const { languageTag } = RNLocalize.findBestAvailableLanguage(availableLanguages) || defaultLanguage;

// @ts-ignore
i18n.isTranslated = (text?: string) => text in englishJson;

setLanguage(languageTag);
i18n.fallbacks = true;

type Ti18n = {
	isRTL: boolean;
	t(scope: TTranslatedKeys, options?: any): string;
	isTranslated: (text?: string) => boolean;
} & typeof i18n;

export default i18n as Ti18n;

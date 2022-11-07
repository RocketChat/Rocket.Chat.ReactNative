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
		label: '简体中文',
		value: 'zh-CN',
		file: () => require('./locales/zh-CN.json')
	},
	{
		label: '繁體中文',
		value: 'zh-TW',
		file: () => require('./locales/zh-TW.json')
	},
	{
		label: 'Deutsch',
		value: 'de',
		file: () => require('./locales/de.json')
	},
	{
		label: 'Español (ES)',
		value: 'es-ES',
		file: () => require('./locales/es-ES.json')
	},
	{
		label: 'Français',
		value: 'fr',
		file: () => require('./locales/fr.json')
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
		label: 'Nederlands',
		value: 'nl',
		file: () => require('./locales/nl.json')
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
		label: 'العربية',
		value: 'ar',
		file: () => require('./locales/ar.json')
	},
	{
		label: 'Türkçe',
		value: 'tr',
		file: () => require('./locales/tr.json')
	},
	{
		label: 'Slovenian (Slovenia)',
		value: 'sl-SI',
		file: () => require('./locales/sl-SI.json')
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

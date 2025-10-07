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
                label: 'فارسی',
                value: 'fa',
                file: () => require('./locales/fa.json')
        },
        {
                label: 'English',
                value: 'en',
                file: () => require('./locales/en.json')
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

i18n.translations = { fa: translations.fa?.(), en: translations.en?.() };
const defaultLanguage = { languageTag: 'fa', isRTL: true };
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

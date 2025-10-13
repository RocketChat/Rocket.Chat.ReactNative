import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import moment from 'moment';
import 'moment/min/locales';

import { isRTL } from './isRTL';
import { toMomentLocale } from './moment';
import englishJson from './locales/en.json';

export { isRTL };

interface ILanguage {
    label: string;
    value: string;
    file: () => any;
}

interface ITranslations {
    [language: string]: () => typeof englishJson;
}

const defaultLanguage = { languageTag: 'en', isRTL: false };

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
        label: 'Norwegian',
        value: 'no',
        file: () => require('./locales/no.json')
    },
    {
        label: 'Norwegian Nynorsk',
        value: 'nn',
        file: () => require('./locales/nn.json')
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

const translations = LANGUAGES.reduce((ret, item) => {
    ret[item.value] = item.file;
    return ret;
}, {} as ITranslations);

i18n
    .use(initReactI18next)
    .init({
        lng: defaultLanguage.languageTag,
        fallbackLng: defaultLanguage.languageTag,
        defaultNS: [''],
        ns: '',
        initAsync: false,
        debug: __DEV__,
        interpolation: {
            escapeValue: false, // React escapes by default
        },
    });

i18n.addResourceBundle('en', '', englishJson);
// @ts-ignore
i18n.isTranslated = (text?: string) => text in englishJson;

export const setLanguage = (lng: string) => {
    if (!lng) {
        return;
    }

    const prevLocale = i18n.language;

    if (prevLocale === lng) {
        return;
    }

    // server uses lowercase pattern (pt-br), but we're forced to use standard pattern (pt-BR)
    let locale = LANGUAGES.find(ll => ll.value.toLowerCase() === lng.toLowerCase())?.value;
    if (!locale) {
        locale = 'en';
    }

    const translation = translations[lng]?.();

    I18nManager.forceRTL(isRTL(locale));
    I18nManager.swapLeftAndRightInRTL(isRTL(locale));
    moment.locale(toMomentLocale(locale));
    console.log('locale', locale, toMomentLocale(locale));

    i18n.addResourceBundle(lng, '', translation);
    i18n.changeLanguage(lng);
}

const availableLanguages = Object.keys(translations);
const { languageTag } = RNLocalize.findBestAvailableLanguage(availableLanguages) || defaultLanguage;

setLanguage(languageTag);

export default { ...i18n, isRTL };

import i18n from 'i18n-js';
import { I18nManager } from 'react-native';
import * as RNLocalize from 'react-native-localize';

export * from './isRTL';

export const LANGUAGES = [
	{
		label: 'English',
		value: 'en',
		file: require('./locales/en.json')
	}, {
		label: '简体中文',
		value: 'zh-CN',
		file: require('./locales/zh-CN.json')
	}, {
		label: '繁體中文',
		value: 'zh-TW',
		file: require('./locales/zh-TW.json')
	}, {
		label: 'Deutsch',
		value: 'de',
		file: require('./locales/de.json')
	}, {
		label: 'Español (ES)',
		value: 'es-ES',
		file: require('./locales/es-ES.json')
	}, {
		label: 'Français',
		value: 'fr',
		file: require('./locales/fr.json')
	}, {
		label: 'Português (BR)',
		value: 'pt-BR',
		file: require('./locales/pt-BR.json')
	}, {
		label: 'Português (PT)',
		value: 'pt-PT',
		file: require('./locales/pt-PT.json')
	}, {
		label: 'Russian',
		value: 'ru',
		file: require('./locales/ru.json')
	}, {
		label: 'Nederlands',
		value: 'nl',
		file: require('./locales/nl.json')
	}, {
		label: 'Italiano',
		value: 'it',
		file: require('./locales/it.json')
	}, {
		label: '日本語',
		value: 'ja',
		file: require('./locales/ja.json')
	}, {
		label: 'العربية',
		value: 'ar',
		file: require('./locales/ar.json')
	}, {
		label: 'Türkçe',
		value: 'tr',
		file: require('./locales/tr.json')
	}
];

const translations = LANGUAGES.reduce((ret, item) => {
	ret[item.value] = item.file;
	return ret;
}, {});

i18n.translations = translations;
i18n.fallbacks = true;

const defaultLanguage = { languageTag: 'en', isRTL: false };
const availableLanguages = Object.keys(i18n.translations);
const { languageTag, isRTL } = RNLocalize.findBestAvailableLanguage(availableLanguages) || defaultLanguage;

I18nManager.forceRTL(isRTL);
I18nManager.swapLeftAndRightInRTL(isRTL);
i18n.locale = languageTag;
i18n.isRTL = I18nManager.isRTL;

export default i18n;

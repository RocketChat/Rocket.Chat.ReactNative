import i18n from 'i18n-js';
import { I18nManager } from 'react-native';
import * as RNLocalize from 'react-native-localize';

export const LANGUAGES = [
	{
		label: 'English',
		value: 'en',
		file: require('./locales/en').default
	}, {
		label: '简体中文',
		value: 'zh-CN',
		file: require('./locales/zh-CN').default
	}, {
		label: '繁體中文',
		value: 'zh-TW',
		file: require('./locales/zh-TW').default
	}, {
		label: 'Deutsch',
		value: 'de',
		file: require('./locales/de').default
	}, {
		label: 'Español (ES)',
		value: 'es-ES',
		file: require('./locales/es-ES').default
	}, {
		label: 'Français',
		value: 'fr',
		file: require('./locales/fr').default
	}, {
		label: 'Português (BR)',
		value: 'pt-BR',
		file: require('./locales/pt-BR').default
	}, {
		label: 'Português (PT)',
		value: 'pt-PT',
		file: require('./locales/pt-PT').default
	}, {
		label: 'Russian',
		value: 'ru',
		file: require('./locales/ru').default
	}, {
		label: 'Nederlands',
		value: 'nl',
		file: require('./locales/nl').default
	}, {
		label: 'Italiano',
		value: 'it',
		file: require('./locales/it').default
	}, {
		label: '日本語',
		value: 'ja',
		file: require('./locales/ja').default
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
i18n.locale = languageTag;

export default i18n;

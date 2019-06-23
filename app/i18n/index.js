import i18n from 'i18n-js';
import { I18nManager } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import {
	en, ru, fr, de, ptBR, zhCN, ptPT
} from './locales';


i18n.translations = {
	en, ru, 'pt-BR': ptBR, 'zh-CN': zhCN, fr, de, 'pt-PT': ptPT
};
i18n.fallbacks = true;

const fallback = { languageTag: 'en', isRTL: false };
const { languageTag, isRTL } = RNLocalize.findBestAvailableLanguage(Object.keys(i18n.translations)) || fallback;

I18nManager.forceRTL(isRTL);
i18n.locale = languageTag;

export default i18n;

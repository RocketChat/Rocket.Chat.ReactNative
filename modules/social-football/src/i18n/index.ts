import i18n from 'i18n-js';
import { I18nManager } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import rocketChatNl from '../../../../app/i18n/locales/nl';
import moduleNl from './locales/nl';

/**
 * Setting up the Translation Schemes.
 */

i18n.translations = {
	nl: {...rocketChatNl, ...moduleNl},
};
i18n.fallbacks = true;

const defaultLanguage = { languageTag: 'nl', isRTL: false };
const availableLanguages = Object.keys(i18n.translations);
const { languageTag, isRTL } = RNLocalize.findBestAvailableLanguage(availableLanguages) || defaultLanguage;

I18nManager.forceRTL(isRTL);
i18n.locale = languageTag;

export default i18n;
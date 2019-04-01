const DEFAULT_LOCALE = "en";

import defaultI18nProvider from "./defaultI18nProvider";
import translate from "./translate";
import TranslationProvider from "./TranslationProvider";
import i18n from "./redux/sagas/i18n";

export {
  DEFAULT_LOCALE,
  defaultI18nProvider,
  translate,
  TranslationProvider,
  i18n
};

// also can see this:
// https://phraseapp.com/blog/posts/react-native-i18n-with-expo-and-i18next-part-1/

import I18n from 'react-native-i18n';
import en from './locales/en';
import ru from './locales/ru';
import ptBR from './locales/pt-BR';

I18n.fallbacks = true;
I18n.defaultLocale = 'en';

I18n.translations = {
	en, ru, 'pt-BR': ptBR
};

export default I18n;

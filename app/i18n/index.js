import I18n from 'react-native-i18n';
import en from './locales/en';
import ru from './locales/ru';
import fr from './locales/fr';
import ptBR from './locales/pt-BR';
import zhCN from './locales/zh-CN';

I18n.fallbacks = true;
I18n.defaultLocale = 'en';

I18n.translations = {
	en, ru, 'pt-BR': ptBR, 'zh-CN': zhCN, fr
};

export default I18n;

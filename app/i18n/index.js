import I18n from 'react-native-i18n';
import en from './locales/en';
import ru from './locales/ru';
import fr from './locales/fr';
import de from './locales/de';
import ptBR from './locales/pt-BR';
import zhCN from './locales/zh-CN';
import ptPT from './locales/pt-PT';

I18n.fallbacks = true;
I18n.defaultLocale = 'en';

I18n.translations = {
	en, ru, 'pt-BR': ptBR, 'zh-CN': zhCN, fr, de, 'pt-PT': ptPT
};

export default I18n;

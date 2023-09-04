import { useAppSelector } from '../../lib/hooks';

export const useSupportedVersionMessage = () => {
	const { message, i18n } = useAppSelector(state => state.supportedVersions);
	const { language = 'en' } = useAppSelector(state => state.login.user);

	if (!message || !i18n) {
		return null;
	}

	const i18nLang = i18n[language] ?? i18n.en;

	return {
		title: i18nLang.title,
		subtitle: i18nLang.subtitle,
		description: i18nLang.description,
		link: message.link
	};
};

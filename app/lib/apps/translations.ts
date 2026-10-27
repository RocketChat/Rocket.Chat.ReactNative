import { type TAppTranslations } from './definitions';
import i18n from '~/i18n';

export const normalizeLanguage = (language: string) => language.toLowerCase().replace('_', '-');

export const translateAppKey = ({
	appId,
	key,
	translations,
	locale
}: {
	appId: string;
	key: string;
	translations: TAppTranslations;
	locale?: string;
}): string => {
	const languages = translations[appId];
	if (!languages) {
		return key;
	}

	const normalized = normalizeLanguage(locale || i18n.locale);
	const candidates = [normalized, normalized.split('-')[0], 'en'];

	for (const candidate of candidates) {
		const translation = languages[candidate]?.[key];
		if (translation) {
			return translation;
		}
	}

	return key;
};

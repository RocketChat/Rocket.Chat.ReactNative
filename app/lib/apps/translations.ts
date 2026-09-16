import { type TAppTranslations } from './appsStore';
import i18n from '~/i18n';

const normalizeLanguage = (language: string) => language.toLowerCase().replace('_', '-');


export const translateAppKey = ({
	appId,
	key,
	translations,
	locale = i18n.locale
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

	const byLanguage = Object.entries(languages).reduce<{ [language: string]: { [key: string]: string } }>(
		(acc, [language, keys]) => {
			acc[normalizeLanguage(language)] = keys;
			return acc;
		},
		{}
	);

	const normalized = normalizeLanguage(locale);
	const candidates = [normalized, normalized.split('-')[0], 'en'];

	for (const candidate of candidates) {
		const translation = byLanguage[candidate]?.[key];
		if (translation) {
			return translation;
		}
	}

	return key;
};

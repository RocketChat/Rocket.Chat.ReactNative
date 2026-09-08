export type TAppLanguageDictionaries = {
	[language: string]: { [key: string]: string };
};

export type TAppTranslationArgs = { [key: string]: string | number };

export const normalizeAppLanguage = (language: string) => language.toLowerCase().replace(/_/g, '-');

// Apps-Engine sends description/params as self-describing placeholders
// ('app-<appId>.<key>'), but the app's own dictionary is keyed by the bare suffix.
export const stripAppKeyPrefix = (key: string, appId?: string): string => {
	if (!appId) {
		return key;
	}
	for (const prefix of [`app-${appId}.`, `${appId}.`]) {
		if (key.startsWith(prefix)) {
			return key.slice(prefix.length);
		}
	}
	return key;
};

const interpolate = (template: string, args?: TAppTranslationArgs) => {
	if (!args) {
		return template;
	}
	return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, name) => (name in args ? String(args[name]) : match));
};

export const getAppTranslation = (
	dictionaries: TAppLanguageDictionaries | undefined,
	language: string | undefined,
	key: string,
	args?: TAppTranslationArgs
): string | undefined => {
	if (!dictionaries || !key) {
		return undefined;
	}
	const normalized = normalizeAppLanguage(language || 'en');
	const candidates = [normalized, normalized.split('-')[0], 'en'];
	for (const candidate of candidates) {
		const value = dictionaries[candidate]?.[key];
		if (typeof value === 'string') {
			return interpolate(value, args);
		}
	}
	return undefined;
};

type LanguageItem = { language: string; name: string };

const normalizeToBCP47ByName = (input: string, languages: LanguageItem[]): string | undefined => {
	const item = languages.find(lang => lang.language.toLowerCase() === input.toLowerCase());

	if (!item) return;

	const langCode = item.language;

	if (langCode.includes('-')) {
		const [lang, region] = langCode.split('-');
		return `${lang.toLowerCase()}-${region.toUpperCase()}`;
	}

	const defaultRegionByName: Record<string, string> = {
		'Portuguese (Brazil)': 'BR',
		English: 'US',
		Spanish: 'ES',
		French: 'FR',
		'Chinese (Simplified)': 'CN',
		'Chinese (Traditional)': 'TW',
		German: 'DE',
		Italian: 'IT',
		Dutch: 'NL',
		Russian: 'RU'
	};

	const region = defaultRegionByName[item.name];

	return region ? `${langCode.toLowerCase()}-${region}` : langCode.toLowerCase();
};

export default normalizeToBCP47ByName;

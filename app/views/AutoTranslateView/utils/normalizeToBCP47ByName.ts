const defaultRegionMap: Record<string, string> = {
	af: 'ZA', // Afrikaans - South Africa
	am: 'ET', // Amharic - Ethiopia
	ar: 'SA', // Arabic - Saudi Arabia
	az: 'AZ', // Azerbaijani - Azerbaijan
	be: 'BY', // Belarusian - Belarus
	bg: 'BG', // Bulgarian - Bulgaria
	bn: 'BD', // Bengali - Bangladesh
	bs: 'BA', // Bosnian - Bosnia and Herzegovina
	ca: 'ES', // Catalan - Spain
	cs: 'CZ', // Czech - Czech Republic
	cy: 'GB', // Welsh - United Kingdom
	da: 'DK', // Danish - Denmark
	de: 'DE', // German - Germany
	el: 'GR', // Greek - Greece
	en: 'US', // English - United States
	eo: '001', // Esperanto - World (001 = World in UN M.49)
	es: 'ES', // Spanish - Spain
	et: 'EE', // Estonian - Estonia
	eu: 'ES', // Basque - Spain
	fa: 'IR', // Persian - Iran
	fi: 'FI', // Finnish - Finland
	fil: 'PH', // Filipino - Philippines
	fr: 'FR', // French - France
	ga: 'IE', // Irish - Ireland
	gl: 'ES', // Galician - Spain
	gu: 'IN', // Gujarati - India
	he: 'IL', // Hebrew - Israel
	hi: 'IN', // Hindi - India
	hr: 'HR', // Croatian - Croatia
	hu: 'HU', // Hungarian - Hungary
	hy: 'AM', // Armenian - Armenia
	id: 'ID', // Indonesian - Indonesia
	is: 'IS', // Icelandic - Iceland
	it: 'IT', // Italian - Italy
	ja: 'JP', // Japanese - Japan
	jv: 'ID', // Javanese - Indonesia
	ka: 'GE', // Georgian - Georgia
	kk: 'KZ', // Kazakh - Kazakhstan
	km: 'KH', // Khmer - Cambodia
	kn: 'IN', // Kannada - India
	ko: 'KR', // Korean - South Korea
	ky: 'KG', // Kyrgyz - Kyrgyzstan
	lo: 'LA', // Lao - Laos
	lt: 'LT', // Lithuanian - Lithuania
	lv: 'LV', // Latvian - Latvia
	mk: 'MK', // Macedonian - North Macedonia
	ml: 'IN', // Malayalam - India
	mn: 'MN', // Mongolian - Mongolia
	mr: 'IN', // Marathi - India
	ms: 'MY', // Malay - Malaysia
	mt: 'MT', // Maltese - Malta
	my: 'MM', // Burmese - Myanmar
	nb: 'NO', // Norwegian Bokmål - Norway
	ne: 'NP', // Nepali - Nepal
	nl: 'NL', // Dutch - Netherlands
	no: 'NO', // Norwegian - Norway
	pa: 'IN', // Punjabi - India
	pl: 'PL', // Polish - Poland
	ps: 'AF', // Pashto - Afghanistan
	pt: 'BR', // Portuguese - Brazil
	ro: 'RO', // Romanian - Romania
	ru: 'RU', // Russian - Russia
	sd: 'PK', // Sindhi - Pakistan
	si: 'LK', // Sinhala - Sri Lanka
	sk: 'SK', // Slovak - Slovakia
	sl: 'SI', // Slovenian - Slovenia
	so: 'SO', // Somali - Somalia
	sq: 'AL', // Albanian - Albania
	sr: 'RS', // Serbian - Serbia
	su: 'ID', // Sundanese - Indonesia
	sv: 'SE', // Swedish - Sweden
	sw: 'KE', // Swahili - Kenya
	ta: 'IN', // Tamil - India
	te: 'IN', // Telugu - India
	tg: 'TJ', // Tajik - Tajikistan
	th: 'TH', // Thai - Thailand
	tk: 'TM', // Turkmen - Turkmenistan
	tl: 'PH', // Tagalog - Philippines
	tr: 'TR', // Turkish - Turkey
	uk: 'UA', // Ukrainian - Ukraine
	ur: 'PK', // Urdu - Pakistan
	uz: 'UZ', // Uzbek - Uzbekistan
	vi: 'VN', // Vietnamese - Vietnam
	zh: 'CN', // Chinese (simplified) - China
	zh_Hant: 'TW', // Chinese (traditional) - Taiwan
	zu: 'ZA' // Zulu - South Africa
};

const normalizeToBCP47 = (lang: string): string => {
	const region = defaultRegionMap[lang.toLowerCase()];
	if (lang.includes('-') || !region) {
		return lang;
	}

	return `${lang.toLowerCase()}-${region}`;
};

export default normalizeToBCP47;

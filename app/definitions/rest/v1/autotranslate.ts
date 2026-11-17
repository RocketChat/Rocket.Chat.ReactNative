export type AutoTranslateEndpoints = {
	'autotranslate.getSupportedLanguages': {
		GET: (params: { targetLanguage: string }) => {
			languages: { language: string; name: string }[];
		};
	};
	'autotranslate.translateMessage': {
		POST: (params: { messageId: string; targetLanguage: string }) => void;
	};
	'autotranslate.saveSettings': {
		POST: (params: {
			roomId: string;
			field: 'autoTranslate' | 'autoTranslateLanguage';
			value: boolean | string;
			defaultLanguage?: string;
		}) => void;
	};
};

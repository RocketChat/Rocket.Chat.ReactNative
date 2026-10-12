export type AutoTranslateEndpoints = {
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

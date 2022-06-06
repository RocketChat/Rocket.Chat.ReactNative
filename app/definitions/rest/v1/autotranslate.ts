export type AutoTranslateEndpoints = {
	'autotranslate.translateMessage': {
		POST: (params: { messageId: string; targetLanguage: string }) => void;
	};
};

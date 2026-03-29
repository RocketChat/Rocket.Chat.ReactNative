export type AppsTranslationsEndpoints = {
	'apps.translations': {
		GET: (params: { language?: string }) => {
			language: string;
			translations: { [key: string]: string };
		};
	};
};

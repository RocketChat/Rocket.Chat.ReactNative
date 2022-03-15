export type CommandsEndpoints = {
	'commands.preview': {
		GET: (params: { command: string; roomId: string; params: string }) => {
			preview: {
				i18nTitle: string;
				items: any;
			};
		};
	};
};

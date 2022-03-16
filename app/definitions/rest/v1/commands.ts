import { IPreviewItem } from '../../ISlashCommand';

export type CommandsEndpoints = {
	'commands.preview': {
		GET: (params: { command: string; params: string; roomId: string }) => {
			preview?: {
				i18nTitle: string;
				items: IPreviewItem[];
			};
		};
		POST: (params: {
			command: string;
			params: string;
			roomId: string;
			previewItem: IPreviewItem;
			triggerId: string;
			tmid?: string;
		}) => {};
	};
	'commands.run': {
		POST: (params: { command: string; roomId: string; params: string; triggerId?: string; tmid?: string }) => {};
	};
};

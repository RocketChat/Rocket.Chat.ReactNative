import { type IPreviewItem, type ISlashCommandResult } from '../../ISlashCommand';

export type CommandsEndpoints = {
	'commands.list': {
		GET: (params?: { count?: number; offset?: number; sort?: string }) => {
			commands: ISlashCommandResult[];
			success: boolean;
		};
	};
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

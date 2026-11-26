import { type IPreviewItem, type ISlashCommandResult } from '~/definitions/ISlashCommand';
import { type PaginatedRequest } from '../helpers/PaginatedRequest';
import { type PaginatedResult } from '../helpers/PaginatedResult';

export type CommandsEndpoints = {
	'commands.list': {
		GET: (params: PaginatedRequest) => PaginatedResult<{ commands: ISlashCommandResult[]; appsLoaded?: boolean }>;
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

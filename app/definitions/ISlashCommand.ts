import Model from '@nozbe/watermelondb/Model';

export interface ISlashCommand {
	id: string;
	params?: string;
	description?: string;
	clientOnly?: boolean;
	providesPreview?: boolean;
	appId?: string;
}

export type TSlashCommandModel = ISlashCommand & Model;

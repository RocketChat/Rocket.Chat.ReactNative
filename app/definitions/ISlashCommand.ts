import Model from '@nozbe/watermelondb/Model';

export interface ISlashCommand {
	id: string;
	params?: string;
	description?: string;
	clientOnly?: boolean;
	providesPreview?: boolean;
	appId?: string;
}

export interface ISlashCommandResult extends ISlashCommand {
	command: string;
}

export type TSlashCommandModel = ISlashCommand & Model;

// For Command Preview ex: /giphy or /tenor in open.rocket.chat
export interface IPreviewItem {
	id: string;
	type: string;
	value: string;
}

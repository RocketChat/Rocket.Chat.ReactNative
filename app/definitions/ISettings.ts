import Model from '@nozbe/watermelondb/Model';

export interface ISettings {
	id: string;
	valueAsString?: string;
	valueAsBoolean?: boolean;
	valueAsNumber?: number;
	valueAsArray?: string[];
	_updatedAt?: Date;
}

export type TSettingsModel = ISettings & Model;

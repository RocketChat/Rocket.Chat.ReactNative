import Model from '@nozbe/watermelondb/Model';

export interface ISettings {
	id: string;
	valueAsString?: string;
	valueAsBoolean?: boolean;
	valueAsNumber?: number;
	valueAsArray?: string[];
	_updatedAt?: Date;
}

export interface IPreparedSettings {
	_id: string;
	value: string;
	enterprise: boolean;
	valueAsString?: string;
	valueAsBoolean?: boolean;
	valueAsNumber?: number;
}

export interface ISettingsIcon {
	_id: string;
	value: {
		defaultUrl: string;
		url?: string;
	};
	enterprise: boolean;
}

export type TSettingsModel = ISettings & Model;

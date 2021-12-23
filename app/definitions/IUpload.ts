import Model from '@nozbe/watermelondb/Model';

export interface IUpload {
	id: string;
	path?: string;
	name?: string;
	description?: string;
	size: number;
	type?: string;
	store?: string;
	progress: number;
	error: boolean;
	subscription: { id: string };
}

export type TUploadModel = IUpload & Model;

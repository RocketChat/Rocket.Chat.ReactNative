import Model from '@nozbe/watermelondb/Model';

export interface IUpload {
	id?: string;
	rid?: string;
	path: string;
	name?: string;
	tmid?: string;
	description?: string;
	size: number;
	type?: string;
	store?: string;
	progress?: number;
	error?: boolean;
	subscription?: { id: string };
	msg?: string;
}

export type TUploadModel = IUpload & Model;

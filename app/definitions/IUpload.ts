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
	width?: number;
	height?: number;
}

export type TUploadModel = IUpload &
	Model & {
		asPlain: () => IUpload;
	};

export type TSendFileMessageFileInfo = Pick<
	IUpload,
	'rid' | 'path' | 'name' | 'tmid' | 'description' | 'size' | 'type' | 'msg' | 'width' | 'height'
>;

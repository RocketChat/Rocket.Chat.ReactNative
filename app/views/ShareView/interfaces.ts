export interface IAttachment {
	filename: string;
	description?: string;
	size: number;
	mime?: string;
	path: string;
	canUpload: boolean;
	error?: any;
	uri: string;
}

export interface IUseDimensions {
	width: number;
	height: number;
}

export interface IFileUpload {
	name: string;
	uri?: string;
	type?: string;
	filename?: string;
	data?: any;
	chunkStartOffset?: number;
	chunkEndOffset?: number;
}

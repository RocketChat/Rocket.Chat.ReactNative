import { type TRoomsMediaResponse } from '../../../../definitions/rest/v1/rooms';

export type TUploadHeaders = Record<string, string | undefined>;

export interface IFormData {
	name: string;
	uri?: string;
	type?: string;
	filename?: string;
	data?: any;
}

export interface IFileUpload {
	send(): Promise<TRoomsMediaResponse>;
	cancel(): void;
}

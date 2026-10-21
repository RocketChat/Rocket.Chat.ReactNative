import * as FileSystem from 'expo-file-system/legacy';

import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { getRetryAfterFromHeaders } from '../getRetryAfterFromHeaders';
import { parseUploadResponse } from '../parseUploadResponse';
import { type IFormData } from './definitions';
import { UploadNetworkError } from './UploadNetworkError';

export class Upload {
	private uploadUrl: string;
	private file: {
		uri: string;
		type: string | undefined;
		name: string | undefined;
		fieldName?: string;
	} | null;
	private headers: Record<string, string>;
	private formData: any;
	private uploadTask: FileSystem.UploadTask | null;
	private isCancelled: boolean;
	private progressCallback?: (loaded: number, total: number) => void;

	constructor() {
		this.uploadUrl = '';
		this.file = null;
		this.headers = {};
		this.formData = {};
		this.uploadTask = null;
		this.isCancelled = false;
	}

	public setupRequest(
		url: string,
		headers: Record<string, string>,
		progressCallback?: (loaded: number, total: number) => void
	): void {
		this.uploadUrl = url;
		this.headers = headers;
		this.progressCallback = progressCallback;
	}

	public appendFile(item: IFormData): void {
		if (item.uri) {
			this.file = { uri: item.uri, type: item.type, name: item.filename, fieldName: item.name };
		} else {
			this.formData[item.name] = item.data;
		}
	}

	public async send(): Promise<TRoomsMediaResponse> {
		if (!this.file) {
			throw new Error('No file to upload');
		}
		this.uploadTask = FileSystem.createUploadTask(
			this.uploadUrl,
			this.file.uri,
			{
				headers: this.headers,
				httpMethod: 'POST',
				uploadType: FileSystem.FileSystemUploadType.MULTIPART,
				fieldName: this.file.fieldName || 'file',
				mimeType: this.file.type,
				parameters: this.formData
			},
			data => {
				if (data.totalBytesSent && data.totalBytesExpectedToSend && this.progressCallback) {
					this.progressCallback(data.totalBytesSent, data.totalBytesExpectedToSend);
				}
			}
		);

		const response = await this.uploadTask.uploadAsync().catch((error: unknown) => {
			throw this.isCancelled
				? new Error('Upload cancelled')
				: new UploadNetworkError(error instanceof Error ? error.message : undefined);
		});
		if (!response) {
			throw new Error('Upload failed: no response');
		}
		return parseUploadResponse(response.status, response.body, getRetryAfterFromHeaders(response.headers));
	}

	public cancel(): void {
		this.isCancelled = true;
		if (this.uploadTask) {
			this.uploadTask.cancelAsync();
		}
	}
}

import { File, UploadType } from 'expo-file-system';

import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFormData } from './definitions';

const sanitizeFilename = (name: string) => name.replace(/[/\r\n]/g, '_').replace(/"/g, '%22');

export class Upload {
	private uploadUrl = '';
	private headers: Record<string, string> = {};
	private file: IFormData | null = null;
	private parameters: Record<string, string> = {};
	private progressCallback?: (loaded: number, total: number) => void;
	private abortController = new AbortController();

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
			this.file = item;
		} else {
			this.parameters[item.name] = String(item.data);
		}
	}

	public async send(): Promise<TRoomsMediaResponse> {
		if (!this.file?.uri) {
			throw new Error('No file to upload');
		}
		const { uri, filename, name: fieldName, type: mimeType } = this.file;
		try {
			const file = new File(uri);
			if (!file.exists) {
				throw new Error('File not found');
			}
			const response = await file.upload(this.uploadUrl, {
				uploadType: UploadType.MULTIPART,
				sessionType: 'background',
				headers: this.headers,
				fieldName,
				filename: filename ? sanitizeFilename(filename) : undefined,
				mimeType,
				parameters: this.parameters,
				signal: this.abortController.signal,
				onProgress: ({ bytesSent, totalBytes }) => this.progressCallback?.(bytesSent, totalBytes)
			});
			if (response.status < 200 || response.status >= 400) {
				throw new Error(`Error: ${response.status}`);
			}
			return JSON.parse(response.body);
		} catch (error) {
			throw this.abortController.signal.aborted ? new Error('Upload Cancelled') : error;
		}
	}

	public cancel(): void {
		this.abortController.abort();
	}
}

import * as FileSystem from 'expo-file-system/legacy';

import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFormData, UploadHttpError, getRetryAfterFromHeaders, parseUploadErrorBody } from './definitions';

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

	public send(): Promise<TRoomsMediaResponse> {
		return new Promise((resolve, reject) => {
			if (!this.file) {
				reject(new Error('No file to upload'));
				return;
			}
			try {
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

				this.uploadTask
					.uploadAsync()
					.then(response => {
						if (!response || response.status === undefined || response.status === null) {
							reject(new Error('Upload failed: no response'));
							return;
						}
						if (response.status >= 200 && response.status < 300) {
							try {
								resolve(JSON.parse(response.body));
							} catch {
								reject(new Error('Upload failed: invalid server response'));
							}
							return;
						}
						const { serverMessage, body } = parseUploadErrorBody(response.body);
						const retryAfterSeconds = getRetryAfterFromHeaders(response.headers);
						reject(new UploadHttpError(response.status, { serverMessage, body, retryAfterSeconds }));
					})
					.catch((error: unknown) => {
						if (this.isCancelled) {
							reject(new Error('Upload cancelled'));
						} else {
							reject(error);
						}
					});
			} catch (error) {
				reject(error);
			}
		});
	}

	public cancel(): void {
		this.isCancelled = true;
		if (this.uploadTask) {
			this.uploadTask.cancelAsync();
		}
	}
}

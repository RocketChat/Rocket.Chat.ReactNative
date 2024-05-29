import * as FileSystem from 'expo-file-system';

import { TRoomsMediaResponse } from '../../../../definitions/rest/v1/rooms';
import { IFileUpload } from './definitions';

export class Upload {
	private uploadUrl: string;
	private file: {
		uri: string;
		type: string | undefined;
		name: string | undefined;
	} | null;
	private headers: { [key: string]: string };
	private formData: FormData;
	private uploadTask: FileSystem.UploadTask | null;
	private isCancelled: boolean;
	private progressCallback?: (loaded: number, total: number) => void;

	constructor() {
		this.uploadUrl = '';
		this.file = null;
		this.headers = {};
		this.formData = new FormData();
		this.uploadTask = null;
		this.isCancelled = false;
	}

	public setupRequest(
		url: string,
		headers: { [key: string]: string },
		progressCallback?: (loaded: number, total: number) => void
	): void {
		this.uploadUrl = url;
		this.headers = headers;
		this.progressCallback = progressCallback;
	}

	public appendFile(item: IFileUpload): void {
		if (item.uri) {
			this.formData.append(item.name, {
				uri: item.uri,
				type: item.type,
				name: item.filename
			} as any);
			this.file = { uri: item.uri, type: item.type, name: item.filename };
		} else {
			this.formData.append(item.name, item.data);
		}
	}

	public send(): Promise<TRoomsMediaResponse> {
		return new Promise(async (resolve, reject) => {
			try {
				if (!this.file) {
					return reject();
				}
				this.uploadTask = FileSystem.createUploadTask(
					this.uploadUrl,
					this.file.uri,
					{
						headers: this.headers,
						httpMethod: 'POST',
						uploadType: FileSystem.FileSystemUploadType.MULTIPART,
						fieldName: this.file.name,
						mimeType: this.file.type
					},
					data => {
						if (data.totalBytesSent && data.totalBytesExpectedToSend && this.progressCallback) {
							this.progressCallback(data.totalBytesSent, data.totalBytesExpectedToSend);
						}
					}
				);

				const response = await this.uploadTask.uploadAsync();
				if (response && response.status >= 200 && response.status < 400) {
					resolve(JSON.parse(response.body));
				} else {
					reject(new Error(`Error: ${response?.status}`));
				}
			} catch (error) {
				if (this.isCancelled) {
					reject(new Error('Upload cancelled'));
				} else {
					reject(error);
				}
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

class FileUpload {
	private upload: Upload;

	constructor(
		url: string,
		headers: { [key: string]: string },
		data: IFileUpload[],
		progressCallback?: (loaded: number, total: number) => void
	) {
		this.upload = new Upload();
		this.upload.setupRequest(url, headers, progressCallback);
		data.forEach(item => this.upload.appendFile(item));
	}

	public send(): Promise<TRoomsMediaResponse> {
		return this.upload.send();
	}

	public cancel(): void {
		this.upload.cancel();
	}
}

export default FileUpload;

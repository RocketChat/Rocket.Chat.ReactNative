import * as FileSystem from 'expo-file-system';

import { TRoomsMediaResponse } from '../../../../definitions/rest/v1/rooms';
import { IFileUpload } from './definitions';

export class Upload {
	private uploadUrl: string;
	private headers: { [key: string]: string };
	private files: IFileUpload[];
	private uploadTask: FileSystem.UploadTask | null;
	private isCancelled: boolean;
	private progressCallback?: (loaded: number, total: number) => void;

	constructor() {
		this.uploadUrl = '';
		this.headers = {};
		this.files = [];
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
		this.files.push(item);
	}

	public send(): Promise<TRoomsMediaResponse> {
		return new Promise(async (resolve, reject) => {
			try {
				const formData = new FormData();
				for (const item of this.files) {
					if (item.uri) {
						formData.append(item.name, {
							uri: item.uri,
							type: item.type,
							name: item.filename
						} as any);
					} else {
						formData.append(item.name, item.data);
					}
				}

				const uploadTask = FileSystem.createUploadTask(
					this.uploadUrl,
					this.files[0].uri!,
					{
						headers: this.headers,
						httpMethod: 'POST',
						uploadType: FileSystem.FileSystemUploadType.MULTIPART,
						fieldName: this.files[0].name,
						mimeType: this.files[0].type,
						parameters: this.headers
					},
					data => {
						if (data.totalBytesSent && data.totalBytesExpectedToSend && this.progressCallback) {
							this.progressCallback(data.totalBytesSent, data.totalBytesExpectedToSend);
						}
					}
				);

				this.uploadTask = uploadTask;

				const response = await uploadTask.uploadAsync();

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

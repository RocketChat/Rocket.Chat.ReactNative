import * as FileSystem from 'expo-file-system';

import { TRoomsMediaResponse } from '../../../../definitions/rest/v1/rooms';

export interface IFileUpload {
	name: string;
	uri?: string;
	type?: string;
	filename?: string;
	data?: any;
}

export class Upload {
	private uploadUrl: string;
	private headers: { [key: string]: string };
	private files: IFileUpload[];

	constructor() {
		this.uploadUrl = '';
		this.headers = {};
		this.files = [];
	}

	public setupRequest(url: string, headers: { [key: string]: string }): void {
		this.uploadUrl = url;
		this.headers = headers;
	}

	public appendFile(item: IFileUpload): void {
		this.files.push(item);
	}

	public async then(callback: (response: TRoomsMediaResponse) => void): Promise<void> {
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

			const response = await FileSystem.uploadAsync(this.uploadUrl, this.files[0].uri!, {
				headers: this.headers,
				httpMethod: 'POST',
				uploadType: FileSystem.FileSystemUploadType.MULTIPART,
				fieldName: this.files[0].name,
				mimeType: this.files[0].type,
				parameters: this.headers,
				sessionType: FileSystem.FileSystemSessionType.BACKGROUND
			});

			if (response.status >= 200 && response.status < 400) {
				callback(JSON.parse(response.body));
			}
		} catch (error) {
			console.error('Upload failed:', error);
		}
	}

	public catch(callback: (error: any) => void): void {
		// Error handling can be integrated here based on the needs
	}

	public uploadProgress(callback: (loaded: number, total: number) => any): void {
		// Expo FileSystem does not natively support upload progress, so this needs custom implementation if required.
	}

	public cancel(): Promise<void> {
		// Expo FileSystem does not natively support upload cancellation, so this needs custom implementation if required.
		return Promise.resolve();
	}
}

class FileUpload {
	public uploadFile(url: string, headers: { [key: string]: string }, data: IFileUpload[]) {
		const upload = new Upload();
		upload.setupRequest(url, headers);
		data.forEach(item => upload.appendFile(item));
		return upload;
	}
}

const fileUpload = new FileUpload();
export default fileUpload;

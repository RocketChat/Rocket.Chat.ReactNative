import { TRoomsMediaResponse } from '../../../../definitions/rest/v1/rooms';
import { IFormData } from './definitions';

export class Upload {
	private xhr: XMLHttpRequest;
	private formData: FormData;
	private isCancelled: boolean;

	constructor() {
		this.xhr = new XMLHttpRequest();
		this.formData = new FormData();
		this.isCancelled = false;
	}

	public setupRequest(
		url: string,
		headers: { [key: string]: string },
		progressCallback?: (loaded: number, total: number) => void
	): void {
		this.xhr.open('POST', url);
		Object.keys(headers).forEach(key => {
			this.xhr.setRequestHeader(key, headers[key]);
		});

		if (progressCallback) {
			this.xhr.upload.onprogress = ({ loaded, total }) => progressCallback(loaded, total);
		}
	}

	public appendFile(item: IFormData): void {
		if (item.uri) {
			this.formData.append(item.name, {
				uri: item.uri,
				type: item.type,
				name: item.filename
			} as any);
		} else {
			this.formData.append(item.name, item.data);
		}
	}

	public send(): Promise<TRoomsMediaResponse> {
		return new Promise((resolve, reject) => {
			this.xhr.onload = () => {
				if (this.xhr.status >= 200 && this.xhr.status < 400) {
					resolve(JSON.parse(this.xhr.responseText));
				} else {
					reject(new Error(`Error: ${this.xhr.statusText}`));
				}
			};

			this.xhr.onerror = () => {
				reject(new Error('Network Error'));
			};

			this.xhr.onabort = () => {
				if (this.isCancelled) {
					reject(new Error('Upload Cancelled'));
				}
			};

			this.xhr.send(this.formData);
		});
	}

	public cancel(): void {
		this.isCancelled = true;
		this.xhr.abort();
	}
}

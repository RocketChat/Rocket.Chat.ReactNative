import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFormData, UploadHttpError, parseRetryAfter, parseUploadErrorBody } from './definitions';

export class Upload {
	private xhr: XMLHttpRequest;
	private formData: FormData;
	private isCancelled: boolean;

	constructor() {
		this.xhr = new XMLHttpRequest();
		this.formData = new FormData();
		this.keepRawFilenames();
		this.isCancelled = false;
	}

	// React Native's FormData runs filenames through encodeURIComponent, which the server never decodes
	private keepRawFilenames(): void {
		const formData = this.formData as any;
		const getParts = formData.getParts.bind(formData);
		formData.getParts = () =>
			getParts().map((part: any) => {
				if (typeof part.name !== 'string') {
					return part;
				}
				const filename = part.name.replace(/[/\r\n]/g, '_').replace(/"/g, '%22');
				return {
					...part,
					headers: { ...part.headers, 'content-disposition': `form-data; name="${part.fieldName}"; filename="${filename}"` }
				};
			});
	}

	public setupRequest(
		url: string,
		headers: Record<string, string>,
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
				if (this.xhr.status >= 200 && this.xhr.status < 300) {
					try {
						resolve(JSON.parse(this.xhr.responseText));
					} catch {
						reject(new Error('Upload failed: invalid server response'));
					}
				} else {
					const { serverMessage, body } = parseUploadErrorBody(this.xhr.responseText);
					const retryAfterSeconds = parseRetryAfter(this.xhr.getResponseHeader('Retry-After'));
					reject(new UploadHttpError(this.xhr.status, { serverMessage, body, retryAfterSeconds }));
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

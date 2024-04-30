export interface IFileUpload {
	name: string;
	uri?: string;
	type?: string;
	filename?: string;
	data?: any;
}

export class Upload {
	public xhr: XMLHttpRequest;
	public formData: FormData;

	constructor() {
		this.xhr = new XMLHttpRequest();
		this.formData = new FormData();
	}

	public setupRequest(url: string, headers: { [key: string]: string }): void {
		this.xhr.open('POST', url);
		Object.keys(headers).forEach(key => {
			this.xhr.setRequestHeader(key, headers[key]);
		});
	}

	public appendFile(item: IFileUpload): void {
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

	public then(callback: (param: { respInfo: XMLHttpRequest }) => void): void {
		this.xhr.onload = () => callback({ respInfo: this.xhr });
		this.xhr.send(this.formData);
	}

	public catch(callback: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any) | null): void {
		this.xhr.onerror = callback;
	}

	public uploadProgress(callback: (param: number, arg1: number) => any): void {
		this.xhr.upload.onprogress = ({ total, loaded }) => callback(loaded, total);
	}

	public cancel(): Promise<void> {
		this.xhr.abort();
		return Promise.resolve();
	}
}

class FileUpload {
	public uploadFile(url: string, headers: { [x: string]: string }, data: IFileUpload[]) {
		const upload = new Upload();
		upload.setupRequest(url, headers);
		data.forEach(item => upload.appendFile(item));
		return upload;
	}
}

const fileUpload = new FileUpload();
export default fileUpload;

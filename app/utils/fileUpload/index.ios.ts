import { IFileUpload } from './interfaces';

class Upload {
	public xhr: XMLHttpRequest;

	public formData: FormData;

	constructor() {
		this.xhr = new XMLHttpRequest();
		this.formData = new FormData();
	}

	then = (callback: (param: { respInfo: XMLHttpRequest }) => XMLHttpRequest) => {
		this.xhr.onload = () => callback({ respInfo: this.xhr });
		this.xhr.send(this.formData);
	};

	catch = (callback: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any) | null) => {
		this.xhr.onerror = callback;
	};

	uploadProgress = (callback: (param: number, arg1: number) => any) => {
		this.xhr.upload.onprogress = ({ total, loaded }) => callback(loaded, total);
	};

	cancel = () => {
		this.xhr.abort();
		return Promise.resolve();
	};
}

class FileUpload {
	fetch = (method: string, url: string, headers: { [x: string]: string }, data: IFileUpload[]) => {
		const upload = new Upload();
		upload.xhr.open(method, url);

		Object.keys(headers).forEach(key => {
			upload.xhr.setRequestHeader(key, headers[key]);
		});

		data.forEach(item => {
			if (item.uri) {
				upload.formData.append(item.name, {
					// @ts-ignore
					uri: item.uri,
					type: item.type,
					name: item.filename
				});
			} else {
				upload.formData.append(item.name, item.data);
			}
		});

		return upload;
	};
}

const fileUpload = new FileUpload();
export default fileUpload;

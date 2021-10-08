class Upload {
	constructor() {
		this.xhr = new XMLHttpRequest();
		this.formData = new FormData();
	}

	then = (callback) => {
		this.xhr.onload = () => callback({ respInfo: this.xhr });
		this.xhr.send(this.formData);
	}

	catch = (callback) => {
		this.xhr.onerror = callback;
	}

	uploadProgress = (callback) => {
		this.xhr.upload.onprogress = ({ total, loaded }) => callback(loaded, total);
	}

	cancel = () => {
		this.xhr.abort();
		return Promise.resolve();
	}
}

class FileUpload {
	fetch = (method, url, headers, data) => {
		const upload = new Upload();
		upload.xhr.open(method, url);

		Object.keys(headers).forEach((key) => {
			upload.xhr.setRequestHeader(key, headers[key]);
		});

		data.forEach((item) => {
			if (item.uri) {
				upload.formData.append(item.name, {
					uri: item.uri,
					type: item.type,
					name: item.filename
				});
			} else {
				upload.formData.append(item.name, item.data);
			}
		});

		return upload;
	}
}

const fileUpload = new FileUpload();
export default fileUpload;

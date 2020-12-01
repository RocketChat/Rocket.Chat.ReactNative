class FileUpload {
	_xhr = new XMLHttpRequest();

	_formData = new FormData();

	fetch = (method, url, headers, data) => {
		this._xhr.open(method, url);

		Object.keys(headers).forEach((key) => {
			this._xhr.setRequestHeader(key, headers[key]);
		});

		data.forEach((item) => {
			if (item.uri) {
				this._formData.append(item.name, {
					uri: item.uri,
					type: item.type,
					name: item.filename
				});
			} else {
				this._formData.append(item.name, item.data);
			}
		});

		return this;
	}

	then = (callback) => {
		this._xhr.onload = () => callback({ respInfo: this._xhr });
		this._xhr.send(this._formData);
	}

	catch = (callback) => {
		this._xhr.onerror = callback;
	}

	uploadProgress = (callback) => {
		this._xhr.upload.onprogress = ({ total, loaded }) => callback(loaded, total);
	}

	cancel = () => {
		this._xhr.abort();
		return Promise.resolve();
	}
}

const fileUpload = new FileUpload();
export default fileUpload;

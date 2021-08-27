import RNFetchBlob from 'rn-fetch-blob';

class FileUpload {
	fetch = (method, url, headers, data) => {
		const formData = data.map((item) => {
			if (item.uri) {
				return {
					name: item.name,
					type: item.type,
					filename: item.filename,
					data: RNFetchBlob.wrap(decodeURI(item.uri))
				};
			}
			return item;
		});

		return RNFetchBlob.fetch(method, url, headers, formData);
	}
}

const fileUpload = new FileUpload();
export default fileUpload;

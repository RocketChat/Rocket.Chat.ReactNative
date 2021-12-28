import RNFetchBlob from 'rn-fetch-blob';

import { IFileUpload } from './interfaces';

type TMethods = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'post' | 'get' | 'delete' | 'put';

class FileUpload {
	fetch = (method: TMethods, url: string, headers: { [key: string]: string }, data: IFileUpload[]) => {
		const formData = data.map(item => {
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
	};
}

const fileUpload = new FileUpload();
export default fileUpload;

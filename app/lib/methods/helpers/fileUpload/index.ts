import { TRoomsMediaResponse } from '../../../../definitions/rest/v1/rooms';
import { Upload } from './Upload';
import { IFormData } from './definitions';

class FileUpload {
	private upload: Upload;

	constructor(
		url: string,
		headers: { [key: string]: string },
		data: IFormData[],
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

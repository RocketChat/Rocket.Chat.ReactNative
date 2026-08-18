import { type TRoomsMediaResponse } from '../../../../definitions/rest/v1/rooms';
import { Upload } from './Upload';
import { type IFormData, type TUploadHeaders } from './definitions';

const dropUndefinedHeaders = (headers: TUploadHeaders): Record<string, string> =>
	Object.fromEntries(Object.entries(headers).filter(([, value]) => value !== undefined)) as Record<string, string>;

class FileUpload {
	private upload: Upload;

	constructor(
		url: string,
		headers: TUploadHeaders,
		data: IFormData[],
		progressCallback?: (loaded: number, total: number) => void
	) {
		this.upload = new Upload();
		this.upload.setupRequest(url, dropUndefinedHeaders(headers), progressCallback);
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

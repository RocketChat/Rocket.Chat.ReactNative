import { type TRoomsMediaResponse } from '../../../../definitions/rest/v1/rooms';
import { Upload } from './Upload';
import { type IFormData, type TUploadHeaders } from './definitions';

export class MissingUploadAuthHeadersError extends Error {
	readonly error = 'Token_expired';

	constructor() {
		super('Upload requires the X-Auth-Token and X-User-Id headers');
	}
}

const dropUndefinedHeaders = (headers: TUploadHeaders): Record<string, string> =>
	Object.fromEntries(Object.entries(headers).filter(([, value]) => value !== undefined)) as Record<string, string>;

const assertAuthHeaders = (headers: TUploadHeaders): void => {
	if (!headers['X-Auth-Token'] || !headers['X-User-Id']) {
		throw new MissingUploadAuthHeadersError();
	}
};

class FileUpload {
	private upload: Upload;

	private headers: TUploadHeaders;

	constructor(
		url: string,
		headers: TUploadHeaders,
		data: IFormData[],
		progressCallback?: (loaded: number, total: number) => void
	) {
		this.headers = headers;
		this.upload = new Upload();
		this.upload.setupRequest(url, dropUndefinedHeaders(headers), progressCallback);
		data.forEach(item => this.upload.appendFile(item));
	}

	public async send(): Promise<TRoomsMediaResponse> {
		assertAuthHeaders(this.headers);
		return await this.upload.send();
	}

	public cancel(): void {
		this.upload.cancel();
	}
}

export default FileUpload;

import { type TRoomsMediaResponse } from '../../../../definitions/rest/v1/rooms';
import i18n from '../../../../i18n';
import { Upload } from './Upload';
import { type IFormData, type TUploadHeaders } from './definitions';

const authHeaders = ['X-Auth-Token', 'X-User-Id'];

export class MissingUploadAuthHeadersError extends Error {
	constructor() {
		super(i18n.t('Token_expired'));
	}
}

const dropUndefinedHeaders = (headers: TUploadHeaders): Record<string, string> =>
	Object.fromEntries(Object.entries(headers).filter(([, value]) => value !== undefined)) as Record<string, string>;

const assertAuthHeaders = (headers: TUploadHeaders): void => {
	if (authHeaders.some(header => !headers[header])) {
		throw new MissingUploadAuthHeadersError();
	}
};

class FileUpload {
	private upload: Upload;

	constructor(
		url: string,
		headers: TUploadHeaders,
		data: IFormData[],
		progressCallback?: (loaded: number, total: number) => void
	) {
		assertAuthHeaders(headers);
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

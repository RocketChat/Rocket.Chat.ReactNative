export class UploadNetworkError extends Error {
	constructor(message = 'Network Error') {
		super(message);
		this.name = 'UploadNetworkError';
	}
}

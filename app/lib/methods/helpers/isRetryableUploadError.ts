const PERMANENT_UPLOAD_ERRORS = [400, 404, 413, 415, 422];

export const isRetryableUploadError = (status?: number): boolean =>
	status === undefined || !PERMANENT_UPLOAD_ERRORS.includes(status);

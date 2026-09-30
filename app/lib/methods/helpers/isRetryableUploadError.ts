const RETRYABLE_CLIENT_ERRORS = [401, 403, 408, 429];

export const isRetryableUploadError = (status?: number): boolean =>
	status === undefined || status < 400 || status >= 500 || RETRYABLE_CLIENT_ERRORS.includes(status);

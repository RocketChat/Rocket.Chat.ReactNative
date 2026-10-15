const RETRYABLE_CLIENT_ERRORS = [401, 403, 408, 429];

export const isRetryableUploadError = (status?: number | null): boolean =>
	status === undefined || status === null || status < 400 || status >= 500 || RETRYABLE_CLIENT_ERRORS.includes(status);

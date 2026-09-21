const RETRYABLE_CLIENT_ERRORS = [408, 429];

export const isRetryableUploadError = (status?: number): boolean => {
	if (status === undefined) {
		return true;
	}
	if (RETRYABLE_CLIENT_ERRORS.includes(status)) {
		return true;
	}
	return status < 400 || status >= 500;
};

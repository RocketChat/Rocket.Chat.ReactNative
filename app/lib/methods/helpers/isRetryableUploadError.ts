// 408 and 429 are the only 4xx the server can answer differently for the exact same request.
const RETRYABLE_CLIENT_ERRORS = [408, 429];

/**
 * Whether retrying an upload byte for byte could ever produce a different result.
 * An unknown status (network failure, cancelled task) counts as retryable.
 */
export const isRetryableUploadError = (status?: number): boolean => {
	if (status === undefined) {
		return true;
	}
	if (RETRYABLE_CLIENT_ERRORS.includes(status)) {
		return true;
	}
	return status < 400 || status >= 500;
};

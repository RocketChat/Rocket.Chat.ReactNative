export const isTransientSendError = (error: unknown): boolean => {
	if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
		return error.status >= 500 || error.status === 429;
	}
	return true;
};

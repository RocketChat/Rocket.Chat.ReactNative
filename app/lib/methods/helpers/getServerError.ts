interface IServerError {
	data?: { errorType?: string; error?: string };
	error?: string;
	reason?: string;
}

export const getServerError = (e: IServerError) => ({
	code: e.data?.errorType ?? e.error,
	reason: e.data?.error ?? e.reason ?? ''
});

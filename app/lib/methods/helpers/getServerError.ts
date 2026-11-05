interface IServerError {
	data?: { errorType?: string; error?: string };
	error?: string;
	reason?: string;
}

const withoutCodeSuffix = (message: string, code?: string) => {
	const suffix = ` [${code}]`;
	return code && message.endsWith(suffix) ? message.slice(0, -suffix.length) : message;
};

export const getServerError = (e: IServerError) => {
	const code = e.data?.errorType ?? e.error;
	return { code, reason: withoutCodeSuffix(e.data?.error ?? e.reason ?? '', code) };
};

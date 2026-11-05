type TErrorDetails = Record<string, unknown>;

interface IServerError {
	data?: { errorType?: string; error?: string; details?: TErrorDetails };
	error?: string;
	reason?: string;
	details?: TErrorDetails;
}

const withoutCodeSuffix = (message: string, code: string) => {
	const suffix = ` [${code}]`;
	return message.endsWith(suffix) ? message.slice(0, -suffix.length) : message;
};

export const getServerError = (e: IServerError) => {
	const code = e.data?.errorType ?? e.error ?? '';
	return { code, reason: withoutCodeSuffix(e.data?.error ?? e.reason ?? '', code), details: e.data?.details ?? e.details };
};

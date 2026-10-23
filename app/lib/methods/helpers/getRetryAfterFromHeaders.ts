import { parseRetryAfter } from './parseRetryAfter';

export const getRetryAfterFromHeaders = (headers?: Record<string, string>): number | undefined => {
	if (!headers) {
		return undefined;
	}
	const key = Object.keys(headers).find(name => name.toLowerCase() === 'retry-after');
	return key ? parseRetryAfter(headers[key]) : undefined;
};

const WAIT_SECONDS_PATTERN = /wait (\d+) seconds/i;

export const parseRetryAfter = (value?: string | null): number | undefined => {
	if (!value) {
		return undefined;
	}
	const seconds = Number(value);
	if (Number.isFinite(seconds)) {
		return seconds > 0 ? seconds : undefined;
	}
	const timestamp = Date.parse(value);
	if (Number.isNaN(timestamp)) {
		return undefined;
	}
	const delta = Math.ceil((timestamp - Date.now()) / 1000);
	return delta > 0 ? delta : undefined;
};

export const getRetryAfterFromHeaders = (headers?: Record<string, string>): number | undefined => {
	if (!headers) {
		return undefined;
	}
	const key = Object.keys(headers).find(name => name.toLowerCase() === 'retry-after');
	return key ? parseRetryAfter(headers[key]) : undefined;
};

export const parseRetryAfterFromMessage = (message?: string): number | undefined => {
	const seconds = Number(message?.match(WAIT_SECONDS_PATTERN)?.[1]);
	return seconds > 0 ? seconds : undefined;
};

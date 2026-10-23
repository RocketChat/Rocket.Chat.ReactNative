const WAIT_SECONDS_PATTERN = /wait (\d+) seconds/i;

export const parseRetryAfterFromMessage = (message?: string): number | undefined => {
	const seconds = Number(message?.match(WAIT_SECONDS_PATTERN)?.[1]);
	return seconds > 0 ? seconds : undefined;
};

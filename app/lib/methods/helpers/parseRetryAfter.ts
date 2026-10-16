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

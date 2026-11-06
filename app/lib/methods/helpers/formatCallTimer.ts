const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const padTwoDigits = (value: number): string => String(value).padStart(2, '0');

export const formatCallTimer = (elapsedSeconds: number): string => {
	const totalSeconds = Math.max(0, Math.floor(elapsedSeconds));
	const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
	const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
	const seconds = totalSeconds % SECONDS_PER_MINUTE;
	const hoursPrefix = hours > 0 ? `${hours}:` : '';
	return `${hoursPrefix}${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`;
};

export const formatDuration = (seconds: number): string => {
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	const hoursStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
	return `${hoursStr}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

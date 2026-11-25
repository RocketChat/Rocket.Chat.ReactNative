export const UNKNOWN_MEDIA_TIME = '-:--';

export const formatMediaTime = (seconds: number) => {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return UNKNOWN_MEDIA_TIME;
	}
	const total = Math.floor(seconds);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const paddedSeconds = String(total % 60).padStart(2, '0');
	return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}` : `${minutes}:${paddedSeconds}`;
};

export const formatProgressLabel = (currentTime: number, duration: number) => {
	if (!duration) {
		return `${UNKNOWN_MEDIA_TIME} / ${UNKNOWN_MEDIA_TIME}`;
	}
	return `${formatMediaTime(currentTime)} / ${formatMediaTime(duration)}`;
};

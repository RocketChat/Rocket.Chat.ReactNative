import { useEffect, useState } from 'react';

const formatDuration = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const useCallTimer = (startTime: number | null): string => {
	const [elapsed, setElapsed] = useState(0);

	useEffect(() => {
		if (!startTime) {
			setElapsed(0);
			return;
		}

		const updateElapsed = () => {
			const now = Date.now();
			setElapsed(Math.floor((now - startTime) / 1000));
		};

		updateElapsed();
		const interval = setInterval(updateElapsed, 1000);

		return () => clearInterval(interval);
	}, [startTime]);

	return formatDuration(elapsed);
};

import React, { useEffect, useState } from 'react';

interface ICallTimer {
	startTime: number;
}

const formatDuration = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const CallTimer = ({ startTime }: ICallTimer): string => {
	const [elapsed, setElapsed] = useState(0);

	useEffect(() => {
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

export default CallTimer;

import { useEffect, useState } from 'react';

const TICK_MS = 1000;

export const useElapsedSeconds = (startedAt?: number): number => {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (startedAt === undefined) {
			return;
		}
		const interval = setInterval(() => setNow(Date.now()), TICK_MS);
		return () => clearInterval(interval);
	}, [startedAt]);

	return startedAt === undefined ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
};

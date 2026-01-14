import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { useCallStore } from '../../../lib/services/voip/useCallStore';

const formatDuration = (seconds: number): string => {
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	const hoursStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
	return `${hoursStr}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Timer = () => {
	const callStartTime = useCallStore(state => state.callStartTime);
	const [duration, setDuration] = useState(callStartTime ? Math.floor((new Date().getTime() - callStartTime) / 1000) : 0);

	useEffect(() => {
		if (!callStartTime) {
			return;
		}
		const updateDuration = () => {
			setDuration(Math.floor((Date.now() - callStartTime) / 1000));
		};
		updateDuration();
		const interval = setInterval(updateDuration, 1000);
		return () => clearInterval(interval);
	}, [callStartTime]);

	return <Text>{formatDuration(duration)}</Text>;
};

export default Timer;

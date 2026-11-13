import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { formatDuration } from '~/lib/methods/helpers/formatDuration';
import { useCallStore } from '~/lib/services/voip/useCallStore';

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

	return <Text> - {formatDuration(duration)}</Text>;
};

export default Timer;

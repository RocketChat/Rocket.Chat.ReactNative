import { useEffect, useState } from 'react';
import { type StyleProp, Text, type TextStyle } from 'react-native';

const formatDuration = (seconds: number): string => {
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	const hoursStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
	return `${hoursStr}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const PexipCallTimer = ({ startedAt, style }: { startedAt: number; style: StyleProp<TextStyle> }) => {
	const [duration, setDuration] = useState(Math.floor((Date.now() - startedAt) / 1000));

	useEffect(() => {
		const interval = setInterval(() => setDuration(Math.floor((Date.now() - startedAt) / 1000)), 1000);
		return () => clearInterval(interval);
	}, [startedAt]);

	return <Text style={style}>{formatDuration(duration)}</Text>;
};

import { useEffect, useState } from 'react';
import { type StyleProp, Text, type TextStyle } from 'react-native';

import { formatDuration } from '~/lib/methods/helpers/formatDuration';

const elapsedSeconds = (startedAt: number) => Math.floor((Date.now() - startedAt) / 1000);

export const PexipCallTimer = ({ startedAt, style }: { startedAt: number; style: StyleProp<TextStyle> }) => {
	const [duration, setDuration] = useState(() => elapsedSeconds(startedAt));

	useEffect(() => {
		const interval = setInterval(() => setDuration(elapsedSeconds(startedAt)), 1000);
		return () => clearInterval(interval);
	}, [startedAt]);

	return <Text style={style}>{formatDuration(duration)}</Text>;
};

import React, { forwardRef, useImperativeHandle } from 'react';
import { FontVariant, Text } from 'react-native';
import { Audio } from 'expo-av';

import sharedStyles from '../../../../views/Styles';
import { useTheme } from '../../../../theme';
import { formatTime } from './utils';

export interface IDurationRef {
	onRecordingStatusUpdate: (status: Audio.RecordingStatus) => void;
}

export const Duration = forwardRef<IDurationRef>((_, ref) => {
	const [styles] = useStyle();
	const [duration, setDuration] = React.useState('00:00');

	useImperativeHandle(ref, () => ({
		onRecordingStatusUpdate
	}));

	const onRecordingStatusUpdate = (status: Audio.RecordingStatus) => {
		if (!status.isRecording) {
			return;
		}
		setDuration(formatTime(Math.floor(status.durationMillis / 1000)));
	};

	return <Text style={styles.text}>{duration}</Text>;
});

function useStyle() {
	const { colors } = useTheme();
	const styles = {
		text: {
			marginLeft: 12,
			fontSize: 16,
			...sharedStyles.textRegular,
			color: colors.fontDefault,
			fontVariant: ['tabular-nums'] as FontVariant[]
		}
	} as const;
	return [styles, colors] as const;
}

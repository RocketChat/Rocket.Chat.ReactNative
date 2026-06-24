import { forwardRef, useImperativeHandle, useState } from 'react';
import { type FontVariant, Text } from 'react-native';
import { type Audio } from 'expo-av';
import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../../../views/Styles';
import { formatTime } from './utils';

export interface IDurationRef {
	onRecordingStatusUpdate: (status: Audio.RecordingStatus) => void;
}

export const Duration = forwardRef<IDurationRef>((_, ref) => {
	const [duration, setDuration] = useState('00:00');

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

const styles = StyleSheet.create(theme => ({
	text: {
		marginLeft: 12,
		fontSize: 16,
		...sharedStyles.textRegular,
		color: theme.colors.fontDefault,
		fontVariant: ['tabular-nums'] as FontVariant[]
	}
}));

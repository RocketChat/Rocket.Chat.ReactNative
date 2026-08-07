import { useState } from 'react';
import { type FontVariant, Text } from 'react-native';
import { useAudioRecorderState, type AudioRecorder } from 'expo-audio';

import sharedStyles from '../../../../views/Styles';
import { useTheme } from '../../../../theme';
import { formatTime } from './utils';

export const Duration = ({ audioRecorder }: { audioRecorder: AudioRecorder }) => {
	const [styles] = useStyle();
	const recorderState = useAudioRecorderState(audioRecorder);
	const [duration, setDuration] = useState('00:00');

	// Adjust state during render (instead of an effect) to sync the timer with the recorder state
	const nextDuration = recorderState.isRecording ? formatTime(Math.floor(recorderState.durationMillis / 1000)) : duration;
	if (nextDuration !== duration) {
		setDuration(nextDuration);
	}

	return <Text style={styles.text}>{duration}</Text>;
};

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

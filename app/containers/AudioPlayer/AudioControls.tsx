import { View } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';

import { useTheme } from '~/theme';
import styles from './styles';
import PlayButton from './PlayButton';
import Seek from './Seek';
import PlaybackSpeed from './PlaybackSpeed';
import { type TAudioState } from './types';

interface IAudioControls {
	audioState: TAudioState;
	disabled?: boolean;
	loaded: boolean;
	currentTime: SharedValue<number>;
	duration: SharedValue<number>;
	peaks?: number[];
	onPlayPress: () => void;
	onSeek: (time: number) => void;
	testIDPrefix?: string;
}

const AudioControls = ({
	audioState,
	disabled = false,
	loaded,
	currentTime,
	duration,
	peaks,
	onPlayPress,
	onSeek,
	testIDPrefix
}: IAudioControls) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.audioContainer, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeExtraLight }]}>
			<PlayButton disabled={disabled} audioState={audioState} onPress={onPlayPress} testIDPrefix={testIDPrefix} />
			<Seek
				currentTime={currentTime}
				duration={duration}
				loaded={loaded}
				peaks={peaks}
				onChangeTime={onSeek}
				testIDPrefix={testIDPrefix}
			/>
			<PlaybackSpeed testIDPrefix={testIDPrefix} />
		</View>
	);
};

export default AudioControls;

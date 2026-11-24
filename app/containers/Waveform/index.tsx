import { View } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';

import { useTheme } from '~/theme';
import styles from './styles';
import WaveformBar from './WaveformBar';
import { useWaveformBars } from './hooks/useWaveformBars';

interface IWaveform {
	peaks?: number[];
	progress: SharedValue<number>;
}

const Waveform = ({ peaks, progress }: IWaveform) => {
	const { colors } = useTheme();
	const { bars, onLayout } = useWaveformBars(peaks);
	return (
		<View testID='waveform' style={styles.track} onLayout={onLayout}>
			{bars.map(({ peak, position }, index) => (
				<WaveformBar
					key={index}
					peak={peak}
					position={position}
					progress={progress}
					playedColor={colors.badgeBackgroundLevel2}
					unplayedColor={colors.badgeBackgroundLevel1}
				/>
			))}
		</View>
	);
};

export default Waveform;

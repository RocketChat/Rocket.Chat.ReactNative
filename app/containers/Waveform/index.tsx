import { View } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';

import { useTheme } from '~/theme';
import styles from './styles';
import WaveformBar from './WaveformBar';
import { useWaveformBars } from './hooks/useWaveformBars';

interface IWaveform {
	peaks?: number[] | null;
	progress: SharedValue<number>;
}

const Waveform = ({ peaks, progress }: IWaveform) => {
	const { colors } = useTheme();
	const { bars, gap, onLayout } = useWaveformBars(peaks);
	return (
		<View testID='waveform' style={[styles.track, { gap }]} onLayout={onLayout}>
			{bars.map((peak, index) => (
				<WaveformBar
					key={index}
					peak={peak}
					position={(index + 0.5) / bars.length}
					progress={progress}
					playedColor={colors.badgeBackgroundLevel2}
					unplayedColor={colors.badgeBackgroundLevel1}
				/>
			))}
		</View>
	);
};

export default Waveform;

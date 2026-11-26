import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import styles from './styles';

const MIN_BAR_HEIGHT = 0.12;

interface IWaveformBar {
	peak: number;
	position: number;
	progress: SharedValue<number>;
	playedColor: string;
	unplayedColor: string;
}

const WaveformBar = ({ peak, position, progress, playedColor, unplayedColor }: IWaveformBar) => {
	const colorStyle = useAnimatedStyle(() => ({
		backgroundColor: position <= progress.get() ? playedColor : unplayedColor
	}));
	return <Animated.View style={[styles.bar, { height: `${Math.max(peak, MIN_BAR_HEIGHT) * 100}%` }, colorStyle]} />;
};

export default WaveformBar;

import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
	cancelAnimation,
	Extrapolate,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming
} from 'react-native-reanimated';

import { useTheme } from '../theme';
import { themes } from '../lib/constants';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	image: {
		width: 100,
		height: 100,
		resizeMode: 'contain'
	}
});

interface ILoadingProps {
	visible: boolean;
}

const Loading = ({ visible }: ILoadingProps): React.ReactElement => {
	const opacity = useSharedValue(0);
	const scale = useSharedValue(1);
	const { theme } = useTheme();

	useEffect(() => {
		if (visible) {
			opacity.value = withTiming(1, {
				duration: 200
			});
			scale.value = withRepeat(withSequence(withTiming(0, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1);
		}
		return () => {
			cancelAnimation(scale);
		};
	}, [opacity, scale, visible]);

	const animatedOpacity = useAnimatedStyle(() => ({
		opacity: interpolate(opacity.value, [0, 1], [0, themes[theme!].backdropOpacity], Extrapolate.CLAMP)
	}));
	const animatedScale = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(scale.value, [0, 0.5, 1], [1, 1.1, 1]) }] }));

	return (
		<Modal visible={visible} transparent onRequestClose={() => {}}>
			<View style={styles.container} testID='loading'>
				<Animated.View
					style={[
						{
							...StyleSheet.absoluteFillObject,
							backgroundColor: themes[theme!].backdropColor
						},
						animatedOpacity
					]}
				/>
				<Animated.Image source={require('../static/images/logo.png')} style={[styles.image, animatedScale]} />
			</View>
		</Modal>
	);
};

export default Loading;

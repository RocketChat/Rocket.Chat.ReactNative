import React, { useEffect, useState } from 'react';
import { StyleSheet, View, PixelRatio, TouchableWithoutFeedback } from 'react-native';
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
import { Image } from 'expo-image';

import { useTheme } from '../../theme';
import EventEmitter from '../../lib/methods/helpers/events';

const LOADING_EVENT = 'LOADING_EVENT';
export const LOADING_TEST_ID = 'loading';
export const LOADING_BUTTON_TEST_ID = 'loading-button';
export const LOADING_IMAGE_TEST_ID = 'loading-image';

const AnimatedImage = Animated.createAnimatedComponent(Image);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	image: {
		width: PixelRatio.get() * 40,
		height: PixelRatio.get() * 40
	}
});

interface ILoadingEvent {
	visible: boolean;
	onCancel?: null | Function;
}

export const sendLoadingEvent = ({ visible, onCancel }: ILoadingEvent): void =>
	EventEmitter.emit(LOADING_EVENT, { visible, onCancel });

const Loading = (): React.ReactElement | null => {
	const [visible, setVisible] = useState(false);
	const [onCancel, setOnCancel] = useState<null | Function>(null);
	const opacity = useSharedValue(0);
	const scale = useSharedValue(1);
	const { colors } = useTheme();

	const onEventReceived = ({ visible: _visible, onCancel: _onCancel = null }: ILoadingEvent) => {
		if (_visible) {
			// if it's already visible, ignore it
			if (!visible) {
				setVisible(_visible);
				opacity.value = 0;
				scale.value = 1;
				opacity.value = withTiming(1, {
					// 300ms doens't work on expensive navigation animations, like jump to message
					duration: 500
				});
				scale.value = withRepeat(withSequence(withTiming(0, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1);
			}

			// allows to override the onCancel function
			if (_onCancel) {
				setOnCancel(() => () => _onCancel());
			}
		} else {
			setVisible(false);
			reset();
		}
	};

	useEffect(() => {
		const listener = EventEmitter.addEventListener(LOADING_EVENT, onEventReceived);

		return () => EventEmitter.removeListener(LOADING_EVENT, listener);
	}, [visible]);

	const reset = () => {
		cancelAnimation(scale);
		cancelAnimation(opacity);
		setVisible(false);
		setOnCancel(null);
	};

	const onCancelHandler = () => {
		if (!onCancel) {
			return;
		}
		onCancel();
		setVisible(false);
		reset();
	};

	const animatedOpacity = useAnimatedStyle(() => ({
		opacity: interpolate(opacity.value, [0, 1], [0, colors.backdropOpacity], Extrapolate.CLAMP)
	}));
	const animatedScale = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(scale.value, [0, 0.5, 1], [1, 1.1, 1]) }] }));

	if (!visible) {
		return null;
	}
	return (
		<View style={StyleSheet.absoluteFill} testID={LOADING_TEST_ID}>
			<TouchableWithoutFeedback onPress={() => onCancelHandler()} testID={LOADING_BUTTON_TEST_ID}>
				<View style={styles.container}>
					<Animated.View
						style={[
							{
								...StyleSheet.absoluteFillObject,
								backgroundColor: colors.backdropColor
							},
							animatedOpacity
						]}
					/>
					<AnimatedImage
						source={require('../../static/images/logo.png')}
						style={[styles.image, animatedScale]}
						testID={LOADING_IMAGE_TEST_ID}
						contentFit='contain'
					/>
				</View>
			</TouchableWithoutFeedback>
		</View>
	);
};

export default Loading;

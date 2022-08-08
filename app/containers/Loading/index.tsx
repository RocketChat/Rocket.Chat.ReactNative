import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View, PixelRatio, TouchableWithoutFeedback } from 'react-native';
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

import { useTheme } from '../../theme';
import EventEmitter from '../../lib/methods/helpers/events';

export const LOADING_EVENT = 'LOADING_EVENT';
export const LOADING_TEST_ID = 'loading';
export const LOADING_BUTTON_TEST_ID = 'loading-button';
export const LOADING_IMAGE_TEST_ID = 'loading-image';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	image: {
		width: PixelRatio.get() * 40,
		height: PixelRatio.get() * 40,
		resizeMode: 'contain'
	}
});

const Loading = (): React.ReactElement => {
	const [visible, setVisible] = useState(false);
	const [onCancel, setOnCancel] = useState<null | Function>(null);
	const opacity = useSharedValue(0);
	const scale = useSharedValue(1);
	const { colors } = useTheme();

	const onEventReceived = ({
		visible: _visible,
		onCancel: _onCancel = null
	}: {
		visible: boolean;
		onCancel?: null | Function;
	}) => {
		if (_visible) {
			// if it's already visible, ignore it
			if (!visible) {
				setVisible(_visible);
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
		}
	};

	useEffect(() => {
		const listener = EventEmitter.addEventListener(LOADING_EVENT, onEventReceived);
		if (!visible) {
			reset();
		}

		return () => EventEmitter.removeListener(LOADING_EVENT, listener);
	}, [visible]);

	const reset = () => {
		opacity.value = withTiming(0, {
			duration: 200
		});
		setVisible(false);
		setOnCancel(null);
		cancelAnimation(opacity);
		cancelAnimation(scale);
		opacity.value = 0;
		scale.value = 1;
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

	return (
		<Modal visible={visible} transparent onRequestClose={() => {}} testID={LOADING_TEST_ID}>
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
					<Animated.Image
						source={require('../../static/images/logo.png')}
						style={[styles.image, animatedScale]}
						testID={LOADING_IMAGE_TEST_ID}
					/>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

export default Loading;

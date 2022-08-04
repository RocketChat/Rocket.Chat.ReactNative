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

import { useTheme } from '../theme';
import EventEmitter from '../lib/methods/helpers/events';

export const LOADING_EVENT = 'LOADING_EVENT';

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
		console.log('🚀 ~ file: Loading.tsx ~ line 46 ~ visible', visible, _visible);
		if (_visible) {
			// if it's already visible, ignore it
			if (!visible) {
				setVisible(_visible);
				opacity.value = 0;
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

		return () => EventEmitter.removeListener(LOADING_EVENT, listener);
	}, [visible]);

	useEffect(() => {
		if (!visible) {
			reset();
		}
	}, [visible]);

	const reset = () => {
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
		reset();
	};

	const animatedOpacity = useAnimatedStyle(() => ({
		opacity: interpolate(opacity.value, [0, 1], [0, colors.backdropOpacity], Extrapolate.CLAMP)
	}));
	const animatedScale = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(scale.value, [0, 0.5, 1], [1, 1.1, 1]) }] }));

	return (
		<Modal visible={visible} transparent onRequestClose={() => {}}>
			<TouchableWithoutFeedback onPress={() => onCancelHandler()} testID='loading'>
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
					<Animated.Image source={require('../static/images/logo.png')} style={[styles.image, animatedScale]} />
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

export default Loading;

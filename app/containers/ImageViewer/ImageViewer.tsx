import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { withTiming, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Image, ImageStyle } from 'expo-image';

import { useTheme } from '../../theme';

interface ImageViewerProps {
	style?: StyleProp<ImageStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	imageContainerStyle?: StyleProp<ViewStyle>;

	uri: string;
	width: number;
	height: number;
	onLoadEnd?: () => void;
}

const styles = StyleSheet.create({
	flex: {
		flex: 1
	},
	image: {
		flex: 1
	}
});

export const ImageViewer = ({ uri = '', width, height, ...props }: ImageViewerProps): React.ReactElement => {
	const [centerX, setCenterX] = useState(0);
	const [centerY, setCenterY] = useState(0);

	const onLayout = ({
		nativeEvent: {
			layout: { x, y, width, height }
		}
	}: LayoutChangeEvent) => {
		setCenterX(x + width / 2);
		setCenterY(y + height / 2);
	};

	const translationX = useSharedValue<number>(0);
	const translationY = useSharedValue<number>(0);
	const offsetX = useSharedValue<number>(0);
	const offsetY = useSharedValue<number>(0);
	const scale = useSharedValue<number>(1);
	const scaleOffset = useSharedValue<number>(1);

	const style = useAnimatedStyle(() => ({
		transform: [{ translateX: translationX.value }, { translateY: translationY.value }, { scale: scale.value }]
	}));

	const resetScaleAnimation = () => {
		'worklet';

		scaleOffset.value = 1;
		offsetX.value = 0;
		offsetY.value = 0;
		scale.value = withSpring(1);
		translationX.value = withSpring(0, { overshootClamping: true });
		translationY.value = withSpring(0, { overshootClamping: true });
	};

	const clamp = (value: number, min: number, max: number) => {
		'worklet';

		return Math.max(Math.min(value, max), min);
	};

	const pinchGesture = Gesture.Pinch()
		.onUpdate(event => {
			scale.value = clamp(scaleOffset.value * (event.scale > 0 ? event.scale : 1), 1, 4);
		})
		.onEnd(() => {
			scaleOffset.value = scale.value > 0 ? scale.value : 1;
		});

	const panGesture = Gesture.Pan()
		.maxPointers(2)
		.onStart(() => {
			translationX.value = offsetX.value;
			translationY.value = offsetY.value;
		})
		.onUpdate(event => {
			const scaleFactor = scale.value - 1;
			translationX.value = clamp(event.translationX + offsetX.value, -scaleFactor * centerX, scaleFactor * centerX);
			translationY.value = clamp(event.translationY + offsetY.value, -scaleFactor * centerY, scaleFactor * centerY);
		})
		.onEnd(() => {
			offsetX.value = translationX.value;
			offsetY.value = translationY.value;
			if (scale.value === 1) resetScaleAnimation();
		});

	const doubleTapGesture = Gesture.Tap()
		.numberOfTaps(2)
		.maxDelay(120)
		.maxDistance(70)
		.onEnd(event => {
			if (scaleOffset.value > 1) resetScaleAnimation();
			else {
				scale.value = withTiming(2, { duration: 200 });
				translationX.value = withTiming(centerX - event.x, { duration: 200 });
				offsetX.value = centerX - event.x;
				scaleOffset.value = 2;
			}
		});

	const gesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

	const { colors } = useTheme();

	return (
		<View style={[styles.flex, { width, height, backgroundColor: colors.surfaceNeutral }]}>
			<GestureDetector gesture={gesture}>
				<Animated.View onLayout={onLayout} style={[styles.flex, style]}>
					<Image
						// @ts-ignore
						style={styles.image}
						contentFit='contain'
						source={{ uri }}
						{...props}
					/>
				</Animated.View>
			</GestureDetector>
		</View>
	);
};

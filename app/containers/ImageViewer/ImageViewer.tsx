import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, StyleProp, ViewStyle, ImageStyle, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { withTiming, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useTheme } from '../../theme';
import { ImageComponent } from './ImageComponent';

interface ImageViewerProps {
	style?: StyleProp<ImageStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	imageContainerStyle?: StyleProp<ViewStyle>;

	uri: string;
	imageComponentType?: string;
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

export const ImageViewer = ({ uri = '', imageComponentType, width, height, ...props }: ImageViewerProps): React.ReactElement => {
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

	const translationX = useSharedValue(0);
	const translationY = useSharedValue(0);
	const offsetX = useSharedValue(0);
	const offsetY = useSharedValue(0);
	const scale = useSharedValue(1);
	const scaleOffset = useSharedValue(1);

	const style = useAnimatedStyle(() => ({
		transform: [{ translateX: translationX.value }, { translateY: translationY.value }, { scale: scale.value }]
	}));

	const clamp = (value: number, min: number, max: number) => Math.max(Math.min(value, max), min);

	const pinchGesture = Gesture.Pinch()
		.onUpdate(e => {
			scale.value = clamp(scaleOffset.value * e.scale, 1, 2);
		})
		.onEnd(() => {
			scaleOffset.value = scale.value;
			offsetX.value = 0;
			offsetY.value = 0;
		});

	const panGesture = Gesture.Pan()
		.onUpdate(e => {
			const scaleFactor = scale.value - 1;
			translationX.value = clamp(e.translationX + offsetX.value, -scaleFactor * centerX, scaleFactor * centerX);
			translationY.value = clamp(e.translationY + offsetY.value, -scaleFactor * centerY, scaleFactor * centerY);
		})
		.onEnd(() => {
			offsetX.value = translationX.value;
			offsetY.value = translationY.value;
		});

	const doubleTapGesture = Gesture.Tap()
		.numberOfTaps(2)
		.maxDelay(150)
		.onEnd((event, success) => {
			if (success) {
				if (scale.value === 1) {
					scale.value = withTiming(2, { duration: 200 });
					translationX.value = withTiming(centerX - event.x, { duration: 200 });
					offsetX.value = centerX - event.x;
					scaleOffset.value = 2;
				} else {
					scale.value = withSpring(1, { overshootClamping: true });
					scaleOffset.value = 1;
					translationX.value = withTiming(0, { duration: 200 });
					translationY.value = withTiming(0, { duration: 200 });
					offsetX.value = 0;
					offsetY.value = 0;
				}
			}
		});

	const gesture = Gesture.Simultaneous(Gesture.Simultaneous(pinchGesture, panGesture), doubleTapGesture);

	const Component = ImageComponent(imageComponentType);

	const { colors } = useTheme();

	return (
		<View style={[styles.flex, { width, height, backgroundColor: colors.previewBackground }]}>
			<GestureDetector gesture={gesture}>
				<Animated.View onLayout={onLayout} style={[styles.flex, style]}>
					<Component
						// @ts-ignore
						style={styles.image}
						resizeMode='contain'
						source={{ uri }}
						{...props}
					/>
				</Animated.View>
			</GestureDetector>
		</View>
	);
};

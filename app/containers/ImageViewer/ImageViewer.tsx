import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, StyleProp, ViewStyle, ImageStyle, View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	withTiming,
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	SharedValue,
	runOnJS
} from 'react-native-reanimated';

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
	translateOuterX: SharedValue<number>;
	offsetOuterX: SharedValue<number>;
	currItem: SharedValue<number>;
	size: number;
	showHeader: boolean;
	toggleHeader: () => void;
}

const styles = StyleSheet.create({
	flex: {
		flex: 1
	},
	image: {
		flex: 1
	},
	header: {
		position: 'absolute',
		height: 40,
		zIndex: 1,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	}
});

export const ImageViewer = ({
	uri = '',
	imageComponentType,
	width,
	height,
	translateOuterX,
	offsetOuterX,
	currItem,
	size,
	showHeader,
	toggleHeader,
	...props
}: ImageViewerProps): React.ReactElement => {
	console.log(props);
	const [centerX, setCenterX] = useState(0);
	const [centerY, setCenterY] = useState(0);

	const WIDTH_OFFSET = -width;
	const OUTER_EDGE_PAN = 100; // how much to translate when panned on both edges of the outer view

	const onLayout = ({
		nativeEvent: {
			layout: { x, y, width, height }
		}
	}: LayoutChangeEvent) => {
		setCenterX(x + width / 2);
		setCenterY(y + height / 2);
	};

	const translationX = useSharedValue<number>(0);
	const eventTranslationX = useSharedValue<number>(0);
	const translationY = useSharedValue<number>(0);
	const offsetX = useSharedValue<number>(0);
	const offsetY = useSharedValue<number>(0);
	const scale = useSharedValue<number>(1);
	const scaleOffset = useSharedValue<number>(1);

	const style = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: translationX.value
			},
			{
				translateY: translationY.value
			},
			{
				scale: scale.value
			}
		]
	}));

	const resetScaleAnimation = () => {
		'worklet';

		scaleOffset.value = 1;
		offsetOuterX.value = WIDTH_OFFSET * currItem.value;
		offsetX.value = 0;
		offsetY.value = 0;
		scale.value = withSpring(1);
		translationX.value = withSpring(0, {
			overshootClamping: true
		});
		translateOuterX.value = withSpring(WIDTH_OFFSET * currItem.value, {
			overshootClamping: true
		});
		translationY.value = withSpring(0, {
			overshootClamping: true
		});
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
			translateOuterX.value = offsetOuterX.value;
			translationX.value = offsetX.value;
			translationY.value = offsetY.value;
			eventTranslationX.value = 0;
		})
		.onUpdate(event => {
			const scaleFactor = scale.value - 1;

			translationX.value = clamp(event.translationX + offsetX.value, -scaleFactor * centerX, scaleFactor * centerX);
			translationY.value = clamp(event.translationY + offsetY.value, -scaleFactor * centerY, scaleFactor * centerY);

			// when edge is reached
			if (translationX.value === scaleFactor * centerX || translationX.value === -scaleFactor * centerX) {
				translateOuterX.value = clamp(
					event.translationX - eventTranslationX.value + offsetOuterX.value,
					WIDTH_OFFSET * (size - 1) - OUTER_EDGE_PAN,
					OUTER_EDGE_PAN
				);
			} else {
				eventTranslationX.value = event.translationX; // to get finger moved value after reaching inner edge
			}
		})
		.onEnd(() => {
			const diff = translateOuterX.value - WIDTH_OFFSET * currItem.value; // diff between outer position and outer translation
			const scrollOffset = centerX / 2; // on how much pan go to next image

			// only when outer translate value is changed
			if (diff) {
				let isChanged = true;
				if (diff < -scrollOffset && currItem.value + 1 < size) {
					currItem.value += 1;
				} else if (diff > scrollOffset && currItem.value - 1 >= 0) {
					currItem.value -= 1;
				} else {
					isChanged = false;
				}
				translateOuterX.value = withSpring(WIDTH_OFFSET * currItem.value, { overshootClamping: true });
				offsetOuterX.value = WIDTH_OFFSET * currItem.value;
				if (isChanged) {
					resetScaleAnimation();
					return;
				}
			}

			offsetX.value = translationX.value;
			offsetY.value = translationY.value;
			if (scale.value === 1) resetScaleAnimation();
		});

	const singleTapGesture = Gesture.Tap().onEnd(() => {
		// runOnJS(toggleHeader)();
	});

	const doubleTapGesture = Gesture.Tap()
		.numberOfTaps(2)
		.maxDelay(120)
		.maxDistance(70)
		.onEnd(event => {
			if (scaleOffset.value > 1) resetScaleAnimation();
			else {
				scale.value = withTiming(2, {
					duration: 200
				});
				translationX.value = withTiming(centerX - event.x, {
					duration: 200
				});
				offsetX.value = centerX - event.x;
				scaleOffset.value = 2;
			}
		});

	const gesture = Gesture.Simultaneous(pinchGesture, Gesture.Exclusive(panGesture, doubleTapGesture, singleTapGesture));

	const Component = ImageComponent({ type: imageComponentType, uri });

	const { colors } = useTheme();

	return (
		<View
			style={[
				styles.flex,
				{
					width,
					height,
					overflow: 'hidden',
					paddingHorizontal: 5,
					backgroundColor: colors.previewBackground
				}
			]}
		>
			{/* {showHeader && (
				<View style={[styles.header, { width, backgroundColor: colors.previewBackground }]}>
					<Text>back</Text>
					<Text>title</Text>
					<Text>download</Text>
				</View>
			)} */}

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

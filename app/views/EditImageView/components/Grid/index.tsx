import React from 'react';
import Animated, { clamp, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Cell from '../Cell';
import Row from '../Row';

interface IGridProps {
	width: number;
	height: number;
	sharedValueWidth: SharedValue<number>;
	sharedValueHeight: SharedValue<number>;
	top: SharedValue<number>;
	left: SharedValue<number>;
	prevTranslationX: SharedValue<number>;
	prevTranslationY: SharedValue<number>;
	imageSizeWidth: SharedValue<number>;
	imageSizeHeight: SharedValue<number>;
}

const Grid = ({
	width,
	height,
	sharedValueWidth,
	sharedValueHeight,
	top,
	left,
	prevTranslationX,
	prevTranslationY,
	imageSizeWidth,
	imageSizeHeight
}: IGridProps) => {
	const animatedStyle = useAnimatedStyle(() => ({
		width: sharedValueWidth.value,
		height: sharedValueHeight.value,
		transform: [{ translateX: left.value }, { translateY: top.value }],
		backgroundColor: 'rgba(0, 0, 0, .4)',
		position: 'absolute',
		borderWidth: 1,
		borderColor: 'white',
		alignItems: 'center',
		justifyContent: 'center'
	}));

	const pinchGesture = Gesture.Pinch()
		.onChange(e => {
			const { scale } = e;
			const paddingHorizontal = (width - imageSizeWidth.value) / 2;
			const minHeight = 100;
			const minWidth = 100;

			const newWidth = clamp(imageSizeWidth.value * scale, minWidth, imageSizeWidth.value);
			const newHeight = clamp(imageSizeHeight.value * scale, minHeight, imageSizeHeight.value);

			left.value = paddingHorizontal + clamp(e.focalX - newWidth / 2, paddingHorizontal, (imageSizeWidth.value - newWidth) / 2);
			top.value = clamp(e.focalY - newHeight / 2, 0, (imageSizeHeight.value - newHeight) / 2);

			sharedValueWidth.value = newWidth;
			sharedValueHeight.value = newHeight;
			prevTranslationX.value = left.value;
			prevTranslationY.value = top.value;
		})
		.onEnd(() => {});

	const topLeft = Gesture.Pan()
		.onChange(e => {
			// discover the value that moved;
			const verticalOffset = e.translationY - prevTranslationY.value;
			// discover the new height based on translation;
			const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationY.value), 30, height);
			// add the value on topValue and add a clamp to limit it;
			const newTop = clamp(top.value + verticalOffset, 0, height - newHeight);

			const paddingHorizontal = (width - imageSizeWidth.value) / 2;
			const horizontalOffset = e.translationX - prevTranslationX.value;
			const newWidth = clamp(sharedValueWidth.value - (e.translationX - prevTranslationX.value), 100, imageSizeWidth.value);
			const newLeft = clamp(
				paddingHorizontal + left.value + horizontalOffset,
				paddingHorizontal,
				width - newWidth - paddingHorizontal
			);

			if (newTop > 0) {
				sharedValueHeight.value = newHeight > height * 0.999 ? height : newHeight;
				top.value = newHeight > height * 0.999 ? 0 : newTop;
			}

			if (newLeft > 0) {
				sharedValueWidth.value = newWidth > width * 0.999 ? width : newWidth;
				left.value = newWidth > width * 0.999 ? paddingHorizontal : newLeft;
			}

			prevTranslationY.value = e.translationY;
			prevTranslationX.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationY.value = 0;
			prevTranslationX.value = 0;
		});
	const topCenter = Gesture.Pan()
		.onChange(e => {
			const offset = e.translationY - prevTranslationY.value;
			const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationY.value), 30, height);
			const newTop = clamp(top.value + offset, 0, height - newHeight);

			if (newTop > 0) {
				sharedValueHeight.value = newHeight;
				top.value = newTop;
			}

			prevTranslationY.value = e.translationY;
		})
		.onFinalize(() => {
			prevTranslationY.value = 0;
		});
	const topRight = Gesture.Pan()
		.onChange(e => {
			const verticalOffset = e.translationY - prevTranslationY.value;
			const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationY.value), 30, height);
			const newTop = clamp(top.value + verticalOffset, 0, height - newHeight);
			const horizontalOffset = e.translationX * -1 + prevTranslationX.value;
			const newWidth = clamp(sharedValueWidth.value - horizontalOffset, 100, imageSizeWidth.value);

			if (newTop > 0) {
				sharedValueHeight.value = newHeight > height * 0.999 ? height : newHeight;
				top.value = newHeight > height * 0.999 ? 0 : newTop;
			}

			if (newWidth + left.value < width) {
				sharedValueWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
			}

			prevTranslationY.value = e.translationY;
			prevTranslationX.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationY.value = 0;
			prevTranslationX.value = 0;
		});

	const leftCenter = Gesture.Pan()
		.onChange(e => {
			const paddingHorizontal = (width - imageSizeWidth.value) / 2;
			const offset = e.translationX - prevTranslationX.value;
			const newWidth = clamp(sharedValueWidth.value - (e.translationX - prevTranslationX.value), 100, imageSizeWidth.value);
			const newLeft = clamp(paddingHorizontal + left.value + offset, paddingHorizontal, width - newWidth - paddingHorizontal);
			if (newLeft > 0) {
				sharedValueWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
				left.value = newWidth > imageSizeWidth.value * 0.999 ? paddingHorizontal : newLeft;
			}

			prevTranslationX.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationX.value = 0;
		});
	const moveGrid = Gesture.Pan()
		.onChange(e => {
			const paddingHorizontal = (width - imageSizeWidth.value) / 2;
			const offset = e.translationX - prevTranslationX.value;
			const verticalOffset = e.translationY - prevTranslationY.value;
			const newLeft = clamp(
				left.value + offset,
				paddingHorizontal,
				imageSizeWidth.value + paddingHorizontal - sharedValueWidth.value
			);
			const newTop = clamp(top.value + verticalOffset, 0, height - sharedValueHeight.value);
			if (sharedValueWidth.value < imageSizeWidth.value) {
				left.value = newLeft;
			}

			if (sharedValueHeight.value < height) {
				top.value = newTop;
			}

			prevTranslationX.value = e.translationX;
			prevTranslationY.value = e.translationY;
		})
		.onFinalize(() => {
			prevTranslationX.value = 0;
			prevTranslationY.value = 0;
		});
	const rightCenter = Gesture.Pan()
		.onChange(e => {
			const offset = e.translationX * -1 + prevTranslationX.value;
			const newWidth = clamp(sharedValueWidth.value - offset, 100, imageSizeWidth.value);
			if (newWidth + left.value < width) {
				sharedValueWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
			}
			prevTranslationX.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationX.value = 0;
		});

	const bottomLeft = Gesture.Pan()
		.onChange(e => {
			const paddingHorizontal = (width - imageSizeWidth.value) / 2;
			const horizontalOffset = e.translationX - prevTranslationX.value;
			const newWidth = clamp(sharedValueWidth.value - (e.translationX - prevTranslationX.value), 100, imageSizeWidth.value);
			const newLeft = clamp(
				paddingHorizontal + left.value + horizontalOffset,
				paddingHorizontal,
				width - newWidth - paddingHorizontal
			);

			const offset = e.translationY * -1 + prevTranslationY.value;
			const newHeight = clamp(sharedValueHeight.value - offset, 30, height);

			if (newHeight + top.value < height) {
				sharedValueHeight.value = newHeight > height * 0.999 ? height : newHeight;
			}

			if (newLeft > 0) {
				sharedValueWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
				left.value = newWidth > imageSizeWidth.value * 0.999 ? paddingHorizontal : newLeft;
			}

			prevTranslationY.value = e.translationY;
			prevTranslationX.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationY.value = 0;
			prevTranslationX.value = 0;
		});
	const bottomCenter = Gesture.Pan()
		.onChange(e => {
			const offset = e.translationY * -1 + prevTranslationY.value;
			const newHeight = clamp(sharedValueHeight.value - offset, 30, height);
			if (newHeight + top.value < height) {
				sharedValueHeight.value = newHeight > height * 0.999 ? height : newHeight;
			}
			prevTranslationY.value = e.translationY;
		})
		.onFinalize(() => {
			prevTranslationY.value = 0;
		});
	const bottomRight = Gesture.Pan()
		.onChange(e => {
			const horizontalOffset = e.translationX * -1 + prevTranslationX.value;
			const newWidth = clamp(sharedValueWidth.value - horizontalOffset, 100, imageSizeWidth.value);
			const offset = e.translationY * -1 + prevTranslationY.value;
			const newHeight = clamp(sharedValueHeight.value - offset, 30, height);
			if (newHeight + top.value < height) {
				sharedValueHeight.value = newHeight > height * 0.999 ? height : newHeight;
			}
			if (newWidth + left.value < width) {
				sharedValueWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
			}

			prevTranslationY.value = e.translationY;
			prevTranslationX.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationY.value = 0;
			prevTranslationX.value = 0;
		});

	return (
		<GestureDetector gesture={pinchGesture}>
			<Animated.View style={animatedStyle}>
				<Row>
					<Cell gesture={Gesture.Race(pinchGesture, topLeft)} />
					<Cell gesture={Gesture.Race(pinchGesture, topCenter)} />
					<Cell gesture={Gesture.Race(pinchGesture, topRight)} />
				</Row>

				<Row>
					<Cell gesture={Gesture.Race(pinchGesture, leftCenter)} />
					<Cell gesture={Gesture.Race(pinchGesture, moveGrid)} />
					<Cell gesture={Gesture.Race(pinchGesture, rightCenter)} />
				</Row>

				<Row>
					<Cell gesture={Gesture.Race(pinchGesture, bottomLeft)} />
					<Cell gesture={Gesture.Race(pinchGesture, bottomCenter)} />
					<Cell gesture={Gesture.Race(pinchGesture, bottomRight)} />
				</Row>
			</Animated.View>
		</GestureDetector>
	);
};

export default Grid;

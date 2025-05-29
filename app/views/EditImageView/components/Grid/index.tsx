import React from 'react';
import Animated, { clamp, SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '../../../../theme';
import Cell from '../Cell';
import Row from '../Row';

interface IGridProps {
	width: number;
	height: number;
	gridWidth: SharedValue<number>;
	gridHeight: SharedValue<number>;
	translationX: SharedValue<number>;
	translationY: SharedValue<number>;
	prevTranslationX: SharedValue<number>;
	prevTranslationY: SharedValue<number>;
	imageSizeWidth: SharedValue<number>;
	imageSizeHeight: SharedValue<number>;
}

const SMOOTHING_FACTOR = 0.2;

const Grid = ({
	width,
	height,
	gridWidth,
	gridHeight,
	translationY,
	translationX,
	prevTranslationX,
	prevTranslationY,
	imageSizeWidth,
	imageSizeHeight
}: IGridProps) => {
	const { colors } = useTheme();
	const animatedStyle = useAnimatedStyle(() => ({
		width: gridWidth.value,
		height: gridHeight.value,
		transform: [{ translateX: translationX.value }, { translateY: translationY.value }],
		backgroundColor: colors.overlayBackground,
		position: 'absolute',
		borderWidth: 1,
		borderColor: colors.fontWhite,
		alignItems: 'center',
		justifyContent: 'center'
	}));
	const focalX = useSharedValue(0);
	const focalY = useSharedValue(0);
	const pinchGesture = Gesture.Pinch().onChange(e => {
		const { scale } = e;
		const paddingHorizontal = (width - imageSizeWidth.value) / 2;
		const minHeight = 100;
		const minWidth = 100;

		const newWidth = clamp(imageSizeWidth.value * scale, minWidth, imageSizeWidth.value);
		const newHeight = clamp(imageSizeHeight.value * scale, minHeight, imageSizeHeight.value);
		const newFocalX = focalX.value + SMOOTHING_FACTOR * (e.focalX - focalX.value);
		const newFocalY = focalY.value + SMOOTHING_FACTOR * (e.focalY - focalY.value);

		gridWidth.value = newWidth;
		gridHeight.value = newHeight;
		translationX.value =
			paddingHorizontal + clamp(newFocalX - newWidth / 2, paddingHorizontal, (imageSizeWidth.value - newWidth) / 2);
		translationY.value = clamp(newFocalY - newHeight / 2, 0, (imageSizeHeight.value - newHeight) / 2);
		prevTranslationX.value = translationX.value;
		prevTranslationY.value = translationY.value;
		focalX.value = e.focalX;
		focalY.value = e.focalY;
	});

	const topLeft = Gesture.Pan()
		.onChange(e => {
			// discover the value that moved;
			const verticalOffset = e.translationY - prevTranslationY.value;
			// discover the new height based on translation;
			const newHeight = clamp(gridHeight.value - (e.translationY - prevTranslationY.value), 30, height);
			// add the value on topValue and add a clamp to limit it;
			const newTop = clamp(translationY.value + verticalOffset, 0, height - newHeight);

			const paddingHorizontal = (width - imageSizeWidth.value) / 2;
			const horizontalOffset = e.translationX - prevTranslationX.value;
			const newWidth = clamp(gridWidth.value - (e.translationX - prevTranslationX.value), 100, imageSizeWidth.value);
			const newLeft = clamp(
				paddingHorizontal + translationX.value + horizontalOffset,
				paddingHorizontal,
				width - newWidth - paddingHorizontal
			);

			if (newTop > 0) {
				gridHeight.value = newHeight > height * 0.999 ? height : newHeight;
				translationY.value = newHeight > height * 0.999 ? 0 : newTop;
			}

			if (newLeft > 0) {
				gridWidth.value = newWidth > width * 0.999 ? width : newWidth;
				translationX.value = newWidth > width * 0.999 ? paddingHorizontal : newLeft;
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
			const newHeight = clamp(gridHeight.value - (e.translationY - prevTranslationY.value), 30, height);
			const newTop = clamp(translationY.value + offset, 0, height - newHeight);

			if (newTop > 0) {
				gridHeight.value = newHeight;
				translationY.value = newTop;
			}

			prevTranslationY.value = e.translationY;
		})
		.onFinalize(() => {
			prevTranslationY.value = 0;
		});
	const topRight = Gesture.Pan()
		.onChange(e => {
			const verticalOffset = e.translationY - prevTranslationY.value;
			const newHeight = clamp(gridHeight.value - (e.translationY - prevTranslationY.value), 30, height);
			const newTop = clamp(translationY.value + verticalOffset, 0, height - newHeight);
			const horizontalOffset = e.translationX * -1 + prevTranslationX.value;
			const newWidth = clamp(gridWidth.value - horizontalOffset, 100, imageSizeWidth.value);

			if (newTop > 0) {
				gridHeight.value = newHeight > height * 0.999 ? height : newHeight;
				translationY.value = newHeight > height * 0.999 ? 0 : newTop;
			}

			if (newWidth + translationX.value < width) {
				gridWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
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
			const newWidth = clamp(gridWidth.value - (e.translationX - prevTranslationX.value), 100, imageSizeWidth.value);
			const newLeft = clamp(
				paddingHorizontal + translationX.value + offset,
				paddingHorizontal,
				width - newWidth - paddingHorizontal
			);
			if (newLeft > 0) {
				gridWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
				translationX.value = newWidth > imageSizeWidth.value * 0.999 ? paddingHorizontal : newLeft;
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
				translationX.value + offset,
				paddingHorizontal,
				imageSizeWidth.value + paddingHorizontal - gridWidth.value
			);
			const newTop = clamp(translationY.value + verticalOffset, 0, height - gridHeight.value);
			if (gridWidth.value < imageSizeWidth.value) {
				translationX.value = newLeft;
			}

			if (gridHeight.value < height) {
				translationY.value = newTop;
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
			const newWidth = clamp(gridWidth.value - offset, 100, imageSizeWidth.value);
			if (newWidth + translationX.value < width) {
				gridWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
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
			const newWidth = clamp(gridWidth.value - (e.translationX - prevTranslationX.value), 100, imageSizeWidth.value);
			const newLeft = clamp(
				paddingHorizontal + translationX.value + horizontalOffset,
				paddingHorizontal,
				width - newWidth - paddingHorizontal
			);

			const offset = e.translationY * -1 + prevTranslationY.value;
			const newHeight = clamp(gridHeight.value - offset, 30, height);

			if (newHeight + translationY.value < height) {
				gridHeight.value = newHeight > height * 0.999 ? height : newHeight;
			}

			if (newLeft > 0) {
				gridWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
				translationX.value = newWidth > imageSizeWidth.value * 0.999 ? paddingHorizontal : newLeft;
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
			const newHeight = clamp(gridHeight.value - offset, 30, height);
			if (newHeight + translationY.value < height) {
				gridHeight.value = newHeight > height * 0.999 ? height : newHeight;
			}
			prevTranslationY.value = e.translationY;
		})
		.onFinalize(() => {
			prevTranslationY.value = 0;
		});
	const bottomRight = Gesture.Pan()
		.onChange(e => {
			const horizontalOffset = e.translationX * -1 + prevTranslationX.value;
			const newWidth = clamp(gridWidth.value - horizontalOffset, 100, imageSizeWidth.value);
			const offset = e.translationY * -1 + prevTranslationY.value;
			const newHeight = clamp(gridHeight.value - offset, 30, height);
			if (newHeight + translationY.value < height) {
				gridHeight.value = newHeight > height * 0.999 ? height : newHeight;
			}
			if (newWidth + translationX.value < width) {
				gridWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
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
					<Cell gesture={topLeft} />
					<Cell gesture={topCenter} />
					<Cell gesture={topRight} />
				</Row>

				<Row>
					<Cell gesture={leftCenter} />
					<Cell gesture={moveGrid} />
					<Cell gesture={rightCenter} />
				</Row>

				<Row>
					<Cell gesture={bottomLeft} />
					<Cell gesture={bottomCenter} />
					<Cell gesture={bottomRight} />
				</Row>
			</Animated.View>
		</GestureDetector>
	);
};

export default Grid;

import { useEffect, useState } from 'react';
import { ImageResult, SaveFormat, useImageManipulator } from 'expo-image-manipulator';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import getValueBasedOnOriginal from '../utils/getValueBasedOnOriginal';
import getHorizontalPadding from '../utils/getHorizontalPadding';

interface IUseImageManipulatorProps {
	updateImage: (image: ImageResult) => void;
	updateOriginaImageSize: ({ width, height }: { width: number; height: number }) => void;
	screenWidth: number;
	screenHeight: number;
	editableImage: string;
	originalImageSize: {
		width: number;
		height: number;
	};
}

const useImageEditor = ({
	editableImage,
	originalImageSize,
	screenWidth,
	screenHeight,
	updateImage,
	updateOriginaImageSize
}: IUseImageManipulatorProps) => {
	const [crop, setCrop] = useState(false);
	const imageWidth = useSharedValue(originalImageSize.width);
	const imageHeight = useSharedValue(originalImageSize.height);
	const height = imageHeight.value;
	const sharedValueWidth = useSharedValue(screenWidth);
	const sharedValueHeight = useSharedValue(height);
	const top = useSharedValue(0);
	const left = useSharedValue(0);
	const prevTranslationXValue = useSharedValue(0);
	const prevTranslationYValue = useSharedValue(0);
	const context = useImageManipulator(editableImage);

	const defineImageSize = (originalWidth?: number, originalHeight?: number) => {
		if (!originalWidth || !originalHeight) return;
		const limitHeight = screenHeight * 0.5;

		const widthScale = screenWidth / originalWidth;
		let newWidth = screenWidth;
		let newHeight = originalHeight * widthScale;

		if (newHeight > limitHeight) {
			const heightScale = limitHeight / originalHeight;
			newHeight = limitHeight;
			newWidth = originalWidth * heightScale;
		}

		sharedValueWidth.value = newWidth;
		sharedValueHeight.value = newHeight;
		left.value = (screenWidth - newWidth) / 2;
		top.value = 0;
		imageWidth.value = withTiming(newWidth);
		imageHeight.value = withTiming(newHeight);
	};

	const rotateLeft = async () => {
		context.rotate(-90);
		const image = await context.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});

		updateImage(result);
		defineImageSize(result.width, result.height);
	};

	const rotateRight = async () => {
		context.rotate(90);
		const image = await context.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});

		updateImage(result);
		defineImageSize(result.width, result.height);
	};

	const onCrop = async () => {
		const finalWidth = getValueBasedOnOriginal(sharedValueWidth.value, originalImageSize.width, imageWidth.value);
		const finalHeight = getValueBasedOnOriginal(sharedValueHeight.value, originalImageSize.height, imageHeight.value);
		const originX = getValueBasedOnOriginal(
			left.value - getHorizontalPadding(screenWidth, imageWidth.value),
			originalImageSize.width,
			imageWidth.value
		);
		const originY = getValueBasedOnOriginal(top.value, originalImageSize.height, imageHeight.value);

		context.crop({
			height: finalHeight,
			width: finalWidth,
			originX,
			originY
		});

		const image = await context.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});

		updateOriginaImageSize({ width: finalWidth, height: finalHeight });
		defineImageSize(finalWidth, finalHeight);
		updateImage(result);
		setCrop(false);
	};

	const openCropEditor = () => {
		setCrop(true);
	};

	const cancelCropEditor = () => {
		setCrop(false);
	};

	const onSelectCropOption = (option: string) => {};

	useEffect(() => {
		defineImageSize(originalImageSize.width, originalImageSize.height);
	}, [originalImageSize]);

	return {
		rotateLeft,
		rotateRight,
		onCrop,
		cropSelectorEnabled: crop,
		openCropEditor,
		cancelCropEditor,
		imageWidth,
		imageHeight,
		gridPosition: {
			top,
			left,
			prevTranslationXValue,
			prevTranslationYValue,
			gridWidth: sharedValueWidth,
			gridHeight: sharedValueHeight
		}
	};
};

export default useImageEditor;

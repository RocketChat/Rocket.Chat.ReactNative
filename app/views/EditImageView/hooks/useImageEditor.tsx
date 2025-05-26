import { useEffect, useState } from 'react';
import { ImageResult, SaveFormat, ImageManipulator } from 'expo-image-manipulator';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import getValueBasedOnOriginal from '../utils/getValueBasedOnOriginal';
import getHorizontalPadding from '../utils/getHorizontalPadding';

interface IUseImageManipulatorProps {
	attachments: any[];
	updateImage: (image: ImageResult) => void;
	screenWidth: number;
	screenHeight: number;
	editableImage: any;
	editableImageIsPortrait: boolean;
	originalImageSize: {
		width: number;
		height: number;
	};
	updateEditableImage: (updatedEditableImage: any) => void;
}

const useImageEditor = ({
	attachments,
	editableImage,
	editableImageIsPortrait,
	originalImageSize,
	screenWidth,
	screenHeight,
	updateImage,
	updateEditableImage
}: IUseImageManipulatorProps) => {
	const [editableHistory, setEditableHistory] = useState(attachments.map(item => ({ filename: item.filename, history: [item] })));
	const showUndo = (editableHistory?.find(item => item.filename === editableImage.filename)?.history.length ?? 0) > 1;
	const PORTRAIT_CROP_OPTIONS = ['Original', '1:1', '3:2', '3:4', '16:9'];
	const LANDSCAPE_CROP_OPTIONS = ['Original', '1:1', '3:2', '4:3', '16:9'];
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

	const updateImageHistory = (image: ImageResult) => {
		setEditableHistory(
			editableHistory.map(item => {
				if (item.filename === editableImage.filename) {
					return {
						...item,
						history: [...item.history, image]
					};
				}

				return item;
			})
		);
	};

	const rotateLeft = async () => {
		const rotateImage = ImageManipulator.manipulate(editableImage.uri ?? editableImage.path).rotate(-90);
		const image = await rotateImage.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});

		updateImage(result);
		updateImageHistory(result);
		defineImageSize(result.width, result.height);
	};

	const rotateRight = async () => {
		const rotateImage = ImageManipulator.manipulate(editableImage.uri ?? editableImage.path).rotate(90);
		const image = await rotateImage.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});

		updateImage(result);
		updateImageHistory(result);
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

		const cropImage = ImageManipulator.manipulate(editableImage.uri ?? editableImage.path).crop({
			height: finalHeight,
			width: finalWidth,
			originX,
			originY
		});

		const image = await cropImage.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});

		defineImageSize(finalWidth, finalHeight);
		updateImageHistory(result);
		updateImage(result);
		setCrop(false);
	};

	const openCropEditor = () => {
		setCrop(true);
	};

	const cancelCropEditor = () => {
		setCrop(false);
	};

	const onSelectCropOption = async (option: string) => {
		const [ratioWidth, radioHeight] = option.split(':');
		const ratio = Number(ratioWidth) / Number(radioHeight);
		const newWidth = originalImageSize.width / ratio;
		const newHeight = originalImageSize.height / ratio;
		const originX = (originalImageSize.width - newWidth) / 2;
		const originY = (originalImageSize.height - newHeight) / 2;
		/* context.crop({ width: newWidth, height: newHeight, originX, originY });
		const image = await context.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});
		console.log(result);
		updateImage(result);
		defineImageSize(result.width, result.height); */
	};

	const undoEdit = () => {
		const updatedEditableHistory = editableHistory.map(item => {
			if (item.filename === editableImage.filename) {
				return { ...item, history: item.history.slice(0, -1) };
			}

			return item;
		});

		const editableImageHistory = updatedEditableHistory.find(item => item.filename === editableImage.filename)!.history;
		const lastEditableHistory = editableImageHistory[editableImageHistory?.length - 1];
		setEditableHistory(updatedEditableHistory);
		updateEditableImage({
			...editableImage,
			width: lastEditableHistory.width,
			height: lastEditableHistory.height,
			path: lastEditableHistory.path ?? lastEditableHistory.uri
		});
		// updateImage(lastEditableHistory);
		defineImageSize(lastEditableHistory.width, lastEditableHistory.height);
	};

	useEffect(() => {
		defineImageSize(originalImageSize.width, originalImageSize.height);
	}, [originalImageSize]);

	return {
		rotateLeft,
		rotateRight,
		onCrop,
		cropSelectorEnabled: crop,
		openCropEditor,
		onSelectCropOption,
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
		},
		availableCropOptions: editableImageIsPortrait ? PORTRAIT_CROP_OPTIONS : LANDSCAPE_CROP_OPTIONS,
		showUndo,
		undoEdit
	};
};

export default useImageEditor;

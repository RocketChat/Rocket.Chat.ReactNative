import { useEffect, useState } from 'react';
import { ImageResult, SaveFormat, ImageManipulator } from 'expo-image-manipulator';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { deleteAsync } from 'expo-file-system';

import getValueBasedOnOriginal from '../methods/getValueBasedOnOriginal';
import getHorizontalPadding from '../methods/getHorizontalPadding';
import { LANDSCAPE_CROP_OPTIONS, PORTRAIT_CROP_OPTIONS } from '../constants/cropOptions';

interface IUseImageManipulatorProps {
	isPortrait: boolean;
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
	isPortrait,
	attachments,
	editableImage,
	editableImageIsPortrait,
	originalImageSize,
	screenWidth,
	screenHeight,
	updateImage,
	updateEditableImage
}: IUseImageManipulatorProps) => {
	const [loading, setLoading] = useState<boolean>(false);
	const [editableHistory, setEditableHistory] = useState(attachments.map(item => ({ filename: item.filename, history: [item] })));
	const showUndo = (editableHistory?.find(item => item.filename === editableImage.filename)?.history.length ?? 0) > 1;
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
		const limitHeight = screenHeight * 0.7;

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
		setLoading(true);
		try {
			const rotateImage = ImageManipulator.manipulate(editableImage.uri ?? editableImage.path).rotate(-90);
			const image = await rotateImage.renderAsync();
			const result = await image.saveAsync({
				format: SaveFormat.PNG
			});

			updateImage(result);
			updateImageHistory(result);
			defineImageSize(result.width, result.height);
		} catch (error) {
			// do nothing
		} finally {
			setLoading(false);
		}
	};

	const rotateRight = async () => {
		setLoading(true);
		try {
			const rotateImage = ImageManipulator.manipulate(editableImage.uri ?? editableImage.path).rotate(90);
			const image = await rotateImage.renderAsync();
			const result = await image.saveAsync({
				format: SaveFormat.PNG
			});

			updateImage(result);
			updateImageHistory(result);
			defineImageSize(result.width, result.height);
		} catch (error) {
			// do nothing
		} finally {
			setLoading(false);
		}
	};

	const onCrop = async () => {
		setLoading(true);
		try {
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

			updateImage(result);
			updateImageHistory(result);
			defineImageSize(finalWidth, finalHeight);

			setCrop(false);
		} catch (error) {
			// do nothing
		} finally {
			setLoading(false);
		}
	};

	const openCropEditor = () => {
		setCrop(true);
	};

	const cancelCropEditor = () => {
		setCrop(false);
	};

	const onSelectAspectRatioOption = async (option: string) => {
		if (option === 'Original') {
			const originalImage = attachments.find(item => item.filename === editableImage.filename);
			defineImageSize(originalImage.width, originalImage.height);
			updateImageHistory(originalImage);
			updateImage(originalImage);
			return;
		}
		const [ratioWidth, radioHeight] = option.split(':');
		const ratio = Number(ratioWidth) / Number(radioHeight);
		const originalImage = attachments.find(item => item.filename === editableImage.filename);
		const imageRatio = originalImage.width / originalImage.height;

		let cropWidth = 0;
		let cropHeight = 0;
		let originX = 0;
		let originY = 0;

		if (imageRatio > ratio) {
			cropHeight = originalImage.height;
			cropWidth = cropHeight * ratio;
			originX = (originalImage.width - cropWidth) / 2;
			originY = 0;
		} else {
			cropWidth = originalImage.width;
			cropHeight = cropWidth / ratio;
			originX = 0;
			originY = (originalImage.height - cropHeight) / 2;
		}

		const cropImage = ImageManipulator.manipulate(originalImage.uri ?? originalImage.path).crop({
			height: cropHeight,
			width: cropWidth,
			originX,
			originY
		});
		const image = await cropImage.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});
		defineImageSize(result.width, result.height);
		updateImageHistory(result);
		updateImage(result);
	};

	const undoEdit = async () => {
		const updatedEditableHistory = editableHistory.map(item => {
			if (item.filename === editableImage.filename) {
				return { ...item, history: item.history.slice(0, -1) };
			}

			return item;
		});
		await deleteAsync(editableImage.uri ?? editableImage.path);
		const editableImageHistory = updatedEditableHistory.find(item => item.filename === editableImage.filename)!.history;
		const lastEditableHistory = editableImageHistory[editableImageHistory?.length - 1];
		setEditableHistory(updatedEditableHistory);
		updateEditableImage({
			...editableImage,
			width: lastEditableHistory.width,
			height: lastEditableHistory.height,
			path: lastEditableHistory.path ?? lastEditableHistory.uri
		});
		updateImage(lastEditableHistory);
		defineImageSize(lastEditableHistory.width, lastEditableHistory.height);
	};

	useEffect(() => {
		defineImageSize(originalImageSize.width, originalImageSize.height);
	}, [originalImageSize, isPortrait]);

	return {
		loading,
		rotateLeft,
		rotateRight,
		onCrop,
		cropSelectorEnabled: crop,
		openCropEditor,
		onSelectAspectRatioOption,
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
		availableAspectRatioOptions: editableImageIsPortrait ? PORTRAIT_CROP_OPTIONS : LANDSCAPE_CROP_OPTIONS,
		showUndo,
		undoEdit
	};
};

export default useImageEditor;
